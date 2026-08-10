-- Secure employee invitations, membership lifecycle operations, and team audit history.
-- Apply after drizzle/0003_employee_invitations.sql.

create extension if not exists pgcrypto with schema extensions;

create or replace function public.current_business_role(target_business_id uuid)
returns public.business_member_role
language sql stable security definer set search_path = public
as $$
  select role
  from public.business_memberships
  where business_id = target_business_id
    and profile_id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

create or replace function public.create_business_invitation(
  target_business_id uuid,
  invite_email text,
  invite_role public.business_member_role
)
returns table (invitation_id uuid, invitation_token text, invitation_expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  actor_role public.business_member_role;
  normalized_email text;
  raw_token text;
  new_invitation_id uuid;
  new_expires_at timestamptz := now() + interval '7 days';
begin
  if not public.has_business_permission(target_business_id, 'team.manage') then
    raise exception 'Team management permission required';
  end if;

  actor_role := public.current_business_role(target_business_id);
  normalized_email := lower(btrim(invite_email));

  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address';
  end if;
  if invite_role is null then
    raise exception 'Choose an invitation role';
  end if;
  if invite_role = 'owner' then
    raise exception 'Ownership cannot be assigned through an invitation';
  end if;
  if invite_role = 'admin' and actor_role <> 'owner' then
    raise exception 'Only the owner can invite an administrator';
  end if;
  if exists (
    select 1
    from public.business_memberships membership
    join auth.users account on account.id = membership.profile_id
    where membership.business_id = target_business_id
      and lower(account.email) = normalized_email
      and membership.status in ('active', 'suspended')
  ) then
    raise exception 'This person already belongs to the business';
  end if;

  update public.business_invitations
  set status = 'revoked', revoked_at = now()
  where business_id = target_business_id
    and email = normalized_email
    and status = 'pending';

  raw_token := encode(gen_random_bytes(24), 'hex');
  insert into public.business_invitations (
    business_id, email, role, token_hash, invited_by, expires_at
  ) values (
    target_business_id,
    normalized_email,
    invite_role,
    encode(digest(raw_token, 'sha256'), 'hex'),
    (select auth.uid()),
    new_expires_at
  ) returning id into new_invitation_id;

  insert into public.business_audit_logs (business_id, actor_id, action, metadata)
  values (
    target_business_id,
    (select auth.uid()),
    'team.invitation_created',
    jsonb_build_object('invitation_id', new_invitation_id, 'email', normalized_email, 'role', invite_role)
  );

  return query select new_invitation_id, raw_token, new_expires_at;
end;
$$;

create or replace function public.accept_business_invitation(invitation_token text)
returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare
  invitation public.business_invitations;
  authenticated_email text := lower(coalesce(auth.jwt()->>'email', ''));
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select * into invitation
  from public.business_invitations
  where token_hash = encode(digest(btrim(invitation_token), 'sha256'), 'hex')
    and status = 'pending'
  for update;

  if invitation.id is null then
    raise exception 'Invitation is invalid or no longer available';
  end if;
  if invitation.expires_at <= now() then
    raise exception 'Invitation has expired';
  end if;
  if invitation.email <> authenticated_email then
    raise exception 'Sign in with the email address that received this invitation';
  end if;
  if exists (
    select 1 from public.business_memberships
    where business_id = invitation.business_id
      and profile_id = (select auth.uid())
      and status in ('active', 'suspended')
  ) then
    raise exception 'You already belong to this business';
  end if;

  insert into public.business_memberships (
    business_id, profile_id, role, status, invited_by, joined_at, updated_at
  ) values (
    invitation.business_id, (select auth.uid()), invitation.role, 'active', invitation.invited_by, now(), now()
  )
  on conflict (business_id, profile_id) do update set
    role = excluded.role,
    status = 'active',
    invited_by = excluded.invited_by,
    joined_at = now(),
    updated_at = now();

  update public.business_invitations
  set status = 'accepted', accepted_by = (select auth.uid()), accepted_at = now()
  where id = invitation.id;

  insert into public.business_audit_logs (business_id, actor_id, action, target_profile_id, metadata)
  values (
    invitation.business_id,
    (select auth.uid()),
    'team.invitation_accepted',
    (select auth.uid()),
    jsonb_build_object('invitation_id', invitation.id, 'role', invitation.role)
  );

  return invitation.business_id;
end;
$$;

create or replace function public.revoke_business_invitation(target_invitation_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  invitation public.business_invitations;
begin
  select * into invitation from public.business_invitations
  where id = target_invitation_id and status = 'pending'
  for update;

  if invitation.id is null then
    raise exception 'Pending invitation not found';
  end if;
  if not public.has_business_permission(invitation.business_id, 'team.manage') then
    raise exception 'Team management permission required';
  end if;

  update public.business_invitations set status = 'revoked', revoked_at = now()
  where id = invitation.id;
  insert into public.business_audit_logs (business_id, actor_id, action, metadata)
  values (
    invitation.business_id,
    (select auth.uid()),
    'team.invitation_revoked',
    jsonb_build_object('invitation_id', invitation.id, 'email', invitation.email, 'role', invitation.role)
  );
end;
$$;

create or replace function public.change_business_member_role(
  target_business_id uuid,
  target_profile_id uuid,
  next_role public.business_member_role
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  actor_role public.business_member_role;
  target_role public.business_member_role;
begin
  if not public.has_business_permission(target_business_id, 'team.manage') then
    raise exception 'Team management permission required';
  end if;
  if target_profile_id = (select auth.uid()) then
    raise exception 'You cannot change your own role';
  end if;

  actor_role := public.current_business_role(target_business_id);
  select role into target_role from public.business_memberships
  where business_id = target_business_id and profile_id = target_profile_id and status <> 'removed'
  for update;

  if target_role is null then raise exception 'Team member not found'; end if;
  if target_role = 'owner' or next_role = 'owner' then
    raise exception 'Ownership requires the ownership-transfer workflow';
  end if;
  if (target_role = 'admin' or next_role = 'admin') and actor_role <> 'owner' then
    raise exception 'Only the owner can manage administrators';
  end if;

  update public.business_memberships
  set role = next_role, updated_at = now()
  where business_id = target_business_id and profile_id = target_profile_id;
  insert into public.business_audit_logs (business_id, actor_id, action, target_profile_id, metadata)
  values (
    target_business_id,
    (select auth.uid()),
    'team.role_changed',
    target_profile_id,
    jsonb_build_object('previous_role', target_role, 'next_role', next_role)
  );
end;
$$;

create or replace function public.set_business_member_status(
  target_business_id uuid,
  target_profile_id uuid,
  next_status public.business_membership_status
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  actor_role public.business_member_role;
  target_role public.business_member_role;
  previous_status public.business_membership_status;
begin
  if not public.has_business_permission(target_business_id, 'team.manage') then
    raise exception 'Team management permission required';
  end if;
  if target_profile_id = (select auth.uid()) then
    raise exception 'You cannot change your own membership status';
  end if;
  if next_status not in ('active', 'suspended', 'removed') then
    raise exception 'Unsupported membership status';
  end if;

  actor_role := public.current_business_role(target_business_id);
  select role, status into target_role, previous_status
  from public.business_memberships
  where business_id = target_business_id
    and profile_id = target_profile_id
    and status <> 'removed'
  for update;

  if target_role is null then raise exception 'Team member not found'; end if;
  if target_role = 'owner' then raise exception 'The owner cannot be suspended or removed'; end if;
  if target_role = 'admin' and actor_role <> 'owner' then
    raise exception 'Only the owner can manage administrators';
  end if;

  update public.business_memberships
  set status = next_status, updated_at = now()
  where business_id = target_business_id and profile_id = target_profile_id;
  insert into public.business_audit_logs (business_id, actor_id, action, target_profile_id, metadata)
  values (
    target_business_id,
    (select auth.uid()),
    'team.status_changed',
    target_profile_id,
    jsonb_build_object('previous_status', previous_status, 'next_status', next_status)
  );
end;
$$;

revoke all on function public.create_business_invitation(uuid, text, public.business_member_role) from public;
revoke all on function public.current_business_role(uuid) from public;
revoke all on function public.accept_business_invitation(text) from public;
revoke all on function public.revoke_business_invitation(uuid) from public;
revoke all on function public.change_business_member_role(uuid, uuid, public.business_member_role) from public;
revoke all on function public.set_business_member_status(uuid, uuid, public.business_membership_status) from public;
grant execute on function public.create_business_invitation(uuid, text, public.business_member_role) to authenticated;
grant execute on function public.accept_business_invitation(text) to authenticated;
grant execute on function public.revoke_business_invitation(uuid) to authenticated;
grant execute on function public.change_business_member_role(uuid, uuid, public.business_member_role) to authenticated;
grant execute on function public.set_business_member_status(uuid, uuid, public.business_membership_status) to authenticated;

alter table public.business_invitations enable row level security;
alter table public.business_audit_logs enable row level security;

create policy "participants read business invitations" on public.business_invitations for select
  using (
    public.has_business_permission(business_id, 'team.read')
    or (email = lower(coalesce(auth.jwt()->>'email', '')) and status = 'pending')
  );
create policy "team reads business audit log" on public.business_audit_logs for select
  using (public.has_business_permission(business_id, 'team.read'));

grant select on table public.business_invitations to authenticated;
grant select on table public.business_audit_logs to authenticated;
