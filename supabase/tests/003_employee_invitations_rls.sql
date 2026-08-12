-- Transactional RLS/RPC checks for supabase/migrations/003_employee_invitations.sql.
-- Run in the Supabase SQL Editor after Drizzle 0003 and Supabase 003 are applied.
-- The fixed UUIDs are isolated to this transaction and every record is rolled back.

begin;

create or replace function pg_temp.assert_true(result boolean, message text)
returns void language plpgsql as $$
begin
  if not coalesce(result, false) then
    raise exception 'Assertion failed: %', message;
  end if;
end;
$$;

-- Auth users are required because profiles.id references auth.users.id.
-- The on_auth_user_created trigger creates the matching profile rows.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Test owner"}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'admin@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Test admin"}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'manager@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Test manager"}', now(), now()),
  ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'viewer@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Test viewer"}', now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'invitee@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Test invitee"}', now(), now());

insert into public.businesses (id, owner_id, name, slug)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Invitation RLS test',
  'invitation-rls-test'
);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'admin', 'active'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'manager', 'active'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'viewer', 'active');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner@example.com","role":"authenticated"}',
  true
);

select set_config('test.invitation_token', invitation_token, true),
       set_config('test.invitation_id', invitation_id::text, true)
from public.create_business_invitation(
  '20000000-0000-0000-0000-000000000001',
  'invitee@example.com',
  'manager'
);

select pg_temp.assert_true(
  (select count(*) = 1 from public.business_invitations
   where business_id = '20000000-0000-0000-0000-000000000001'),
  'owner should read the pending invitation'
);
do $$
begin
  begin
    insert into public.business_invitations (
      business_id, email, role, token_hash, invited_by, expires_at
    ) values (
      '20000000-0000-0000-0000-000000000001',
      'bypass@example.com',
      'viewer',
      repeat('a', 64),
      '10000000-0000-0000-0000-000000000001',
      now() + interval '7 days'
    );
    raise exception 'owner unexpectedly inserted an invitation directly';
  exception
    when others then
      if sqlerrm = 'owner unexpectedly inserted an invitation directly' then raise; end if;
  end;
end;
$$;

-- Managers may read the team, but may not mutate it.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","email":"manager@example.com","role":"authenticated"}',
  true
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.business_invitations
   where business_id = '20000000-0000-0000-0000-000000000001'),
  'manager should read team invitations'
);
do $$
begin
  begin
    perform public.revoke_business_invitation(current_setting('test.invitation_id')::uuid);
    raise exception 'manager unexpectedly revoked an invitation';
  exception
    when others then
      if sqlerrm = 'manager unexpectedly revoked an invitation' then raise; end if;
  end;
end;
$$;

-- Viewers cannot read team invitations or audit history.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000004","email":"viewer@example.com","role":"authenticated"}',
  true
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.business_invitations),
  'viewer must not read invitations'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.business_audit_logs),
  'viewer must not read team audit records'
);

-- An authenticated user with a different email cannot discover or accept the invite.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000005","email":"wrong@example.com","role":"authenticated"}',
  true
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.business_invitations),
  'non-matching email must not read the invitation'
);
do $$
begin
  begin
    perform public.accept_business_invitation(current_setting('test.invitation_token'));
    raise exception 'wrong email unexpectedly accepted an invitation';
  exception
    when others then
      if sqlerrm = 'wrong email unexpectedly accepted an invitation' then raise; end if;
  end;
end;
$$;

-- The matching invitee can see and accept only their pending invitation.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000005","email":"invitee@example.com","role":"authenticated"}',
  true
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.business_invitations),
  'matching invitee should read the invitation'
);
select pg_temp.assert_true(
  public.accept_business_invitation(current_setting('test.invitation_token')) =
    '20000000-0000-0000-0000-000000000001'::uuid,
  'matching invitee should accept the invitation'
);
select pg_temp.assert_true(
  exists (
    select 1 from public.business_memberships
    where business_id = '20000000-0000-0000-0000-000000000001'
      and profile_id = '10000000-0000-0000-0000-000000000005'
      and role = 'manager'
      and status = 'active'
  ),
  'acceptance should create the active membership'
);

-- Admins manage non-admin staff but cannot assign the admin role.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","email":"admin@example.com","role":"authenticated"}',
  true
);
select public.change_business_member_role(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000005',
  'barista'
);
do $$
begin
  begin
    perform public.change_business_member_role(
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000005',
      'admin'
    );
    raise exception 'admin unexpectedly assigned another admin';
  exception
    when others then
      if sqlerrm = 'admin unexpectedly assigned another admin' then raise; end if;
  end;
end;
$$;

-- The owner can suspend and restore non-owner staff; the owner is protected.
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner@example.com","role":"authenticated"}',
  true
);
select public.set_business_member_status(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000005',
  'suspended'
);
select pg_temp.assert_true(
  (select status = 'suspended' from public.business_memberships
   where business_id = '20000000-0000-0000-0000-000000000001'
     and profile_id = '10000000-0000-0000-0000-000000000005'),
  'owner should suspend an employee'
);
do $$
begin
  begin
    perform public.set_business_member_status(
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'suspended'
    );
    raise exception 'owner membership was unexpectedly suspended';
  exception
    when others then
      if sqlerrm = 'owner membership was unexpectedly suspended' then raise; end if;
  end;
end;
$$;

-- Anonymous callers cannot read invitations.
set local role anon;
select set_config('request.jwt.claims', '{}', true);
select pg_temp.assert_true(
  (select count(*) = 0 from public.business_invitations),
  'anonymous caller must not read invitations'
);

rollback;
