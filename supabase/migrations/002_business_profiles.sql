-- Business applications, staff memberships, permission checks, and profile security.
-- Apply after drizzle/0002_business_profiles.sql.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'client'::public.user_role,
    coalesce(
      nullif(left(btrim(regexp_replace(new.raw_user_meta_data ->> 'display_name', '[[:cntrl:]]', '', 'g')), 80), ''),
      nullif(left(split_part(coalesce(new.email, ''), '@', 1), 80), ''),
      'Coffee friend'
    )
  );
  return new;
end;
$$;

insert into public.business_memberships (business_id, profile_id, role, status)
select id, owner_id, 'owner'::public.business_member_role, 'active'::public.business_membership_status
from public.businesses
on conflict (business_id, profile_id) do update set role = 'owner', status = 'active';

insert into public.business_locations (business_id, name, address, phone, is_primary)
select business.id, 'Main location', business.address, business.contact_phone, true
from public.businesses business
where not exists (
  select 1 from public.business_locations location where location.business_id = business.id
);

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where profile_id = (select auth.uid())
  );
$$;

create or replace function public.business_role_has_permission(
  member_role public.business_member_role,
  permission_key text
)
returns boolean language sql immutable set search_path = public
as $$
  select case
    when member_role = 'owner' then true
    when member_role = 'admin' then permission_key <> 'ownership.transfer'
    when member_role = 'manager' then permission_key = any(array[
      'business.profile.read', 'business.profile.write', 'menu.manage', 'content.manage',
      'rewards.manage', 'team.read', 'analytics.read'
    ])
    when member_role = 'finance' then permission_key = any(array[
      'business.profile.read', 'payments.read', 'payments.charge', 'payments.refund',
      'payments.connect', 'analytics.read'
    ])
    when member_role = 'barista' then permission_key = any(array[
      'business.profile.read', 'payments.charge', 'loyalty.issue'
    ])
    when member_role = 'viewer' then permission_key = any(array[
      'business.profile.read', 'analytics.read'
    ])
    else false
  end;
$$;

create or replace function public.has_business_permission(target_business_id uuid, permission_key text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships membership
    where membership.business_id = target_business_id
      and membership.profile_id = (select auth.uid())
      and membership.status = 'active'
      and public.business_role_has_permission(membership.role, permission_key)
  );
$$;

create or replace function public.submit_business_application(target_application_id uuid)
returns public.business_applications
language plpgsql security definer set search_path = public
as $$
declare
  result public.business_applications;
begin
  update public.business_applications
  set status = 'submitted', submitted_at = now(), rejection_reason = null, updated_at = now()
  where id = target_application_id
    and applicant_id = (select auth.uid())
    and status in ('draft', 'rejected')
    and char_length(btrim(trading_name)) >= 2
    and char_length(btrim(contact_email)) >= 3
    and char_length(btrim(address)) >= 5
  returning * into result;

  if result.id is null then
    raise exception 'Application cannot be submitted';
  end if;
  return result;
end;
$$;

create or replace function public.review_business_application(
  target_application_id uuid,
  approve boolean,
  review_reason text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  application public.business_applications;
  created_business_id uuid;
  created_slug text;
begin
  if session_user <> 'postgres' and not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;

  select * into application
  from public.business_applications
  where id = target_application_id and status in ('submitted', 'under_review')
  for update;

  if application.id is null then
    raise exception 'Application is not reviewable';
  end if;

  if not approve then
    update public.business_applications
    set status = 'rejected', rejection_reason = nullif(btrim(review_reason), ''),
        reviewed_at = now(), updated_at = now()
    where id = application.id;
    return null;
  end if;

  created_slug := regexp_replace(lower(application.trading_name), '[^a-z0-9]+', '-', 'g');
  created_slug := trim(both '-' from created_slug) || '-' || left(replace(application.id::text, '-', ''), 8);

  insert into public.businesses (
    owner_id, name, slug, description, address, category,
    contact_email, contact_phone, website_url, status, is_published
  ) values (
    application.applicant_id, application.trading_name, created_slug,
    application.description, application.address, application.category,
    application.contact_email, application.contact_phone, application.website_url,
    'onboarding', false
  ) returning id into created_business_id;

  insert into public.business_memberships (business_id, profile_id, role, status)
  values (created_business_id, application.applicant_id, 'owner', 'active');

  insert into public.business_locations (business_id, name, address, phone, is_primary)
  values (created_business_id, 'Main location', application.address, application.contact_phone, true);

  update public.business_applications
  set status = 'approved', reviewed_at = now(), rejection_reason = null, updated_at = now()
  where id = application.id;

  return created_business_id;
end;
$$;

revoke all on function public.submit_business_application(uuid) from public;
grant execute on function public.submit_business_application(uuid) to authenticated;
revoke all on function public.review_business_application(uuid, boolean, text) from public;
grant execute on function public.review_business_application(uuid, boolean, text) to authenticated;

alter table public.business_applications enable row level security;
alter table public.business_memberships enable row level security;
alter table public.business_locations enable row level security;
alter table public.business_hours enable row level security;
alter table public.platform_admins enable row level security;

drop policy if exists "published businesses are readable" on public.businesses;
drop policy if exists "business users create their business" on public.businesses;
drop policy if exists "owners update business" on public.businesses;

create policy "public reads published businesses" on public.businesses for select
  using (is_published or public.has_business_permission(id, 'business.profile.read'));
create policy "members update business profiles" on public.businesses for update
  using (public.has_business_permission(id, 'business.profile.write'))
  with check (public.has_business_permission(id, 'business.profile.write'));

drop policy if exists "owners manage categories" on public.menu_categories;
create policy "members manage categories" on public.menu_categories for all
  using (public.has_business_permission(business_id, 'menu.manage'))
  with check (public.has_business_permission(business_id, 'menu.manage'));

drop policy if exists "owners manage menu items" on public.menu_items;
create policy "members manage menu items" on public.menu_items for all
  using (public.has_business_permission(business_id, 'menu.manage'))
  with check (public.has_business_permission(business_id, 'menu.manage'));

drop policy if exists "owners manage posts" on public.posts;
create policy "members manage posts" on public.posts for all
  using (public.has_business_permission(business_id, 'content.manage'))
  with check (public.has_business_permission(business_id, 'content.manage'));

drop policy if exists "owners manage rewards" on public.rewards;
create policy "members manage rewards" on public.rewards for all
  using (public.has_business_permission(business_id, 'rewards.manage'))
  with check (public.has_business_permission(business_id, 'rewards.manage'));

drop policy if exists "owners manage reward items" on public.reward_items;
create policy "members manage reward items" on public.reward_items for all
  using (exists (
    select 1 from public.rewards reward
    where reward.id = reward_id
      and public.has_business_permission(reward.business_id, 'rewards.manage')
  ))
  with check (exists (
    select 1 from public.rewards reward
    where reward.id = reward_id
      and public.has_business_permission(reward.business_id, 'rewards.manage')
  ));

create policy "applicants read own application" on public.business_applications for select
  using (applicant_id = (select auth.uid()) or public.is_platform_admin());
create policy "applicants create draft application" on public.business_applications for insert
  with check (applicant_id = (select auth.uid()) and status = 'draft');
create policy "applicants edit draft application" on public.business_applications for update
  using (applicant_id = (select auth.uid()) and status in ('draft', 'rejected'))
  with check (applicant_id = (select auth.uid()) and status in ('draft', 'rejected'));

create policy "members read memberships" on public.business_memberships for select
  using (
    profile_id = (select auth.uid())
    or public.has_business_permission(business_id, 'team.read')
  );

create policy "public reads published locations" on public.business_locations for select
  using (
    exists (select 1 from public.businesses where id = business_id and is_published)
    or public.has_business_permission(business_id, 'business.profile.read')
  );
create policy "members manage locations" on public.business_locations for all
  using (public.has_business_permission(business_id, 'business.profile.write'))
  with check (public.has_business_permission(business_id, 'business.profile.write'));

create policy "public reads published hours" on public.business_hours for select
  using (
    exists (
      select 1 from public.business_locations location
      join public.businesses business on business.id = location.business_id
      where location.id = location_id
        and (business.is_published or public.has_business_permission(business.id, 'business.profile.read'))
    )
  );
create policy "members manage hours" on public.business_hours for all
  using (
    exists (
      select 1 from public.business_locations location
      where location.id = location_id
        and public.has_business_permission(location.business_id, 'business.profile.write')
    )
  )
  with check (
    exists (
      select 1 from public.business_locations location
      where location.id = location_id
        and public.has_business_permission(location.business_id, 'business.profile.write')
    )
  );

create policy "admins read own admin record" on public.platform_admins for select
  using (profile_id = (select auth.uid()));

grant select, insert on table public.business_applications to authenticated;
grant update (
  trading_name, legal_name, description, category, contact_email, contact_phone,
  website_url, address, company_number, vat_number, updated_at
) on table public.business_applications to authenticated;
grant select on table public.business_memberships to authenticated;
grant select, update on table public.businesses to authenticated;
grant select, insert, update, delete on table public.business_locations to authenticated;
grant select, insert, update, delete on table public.business_hours to authenticated;

drop policy if exists "authenticated users upload business media" on storage.objects;
create policy "members upload business media" on storage.objects for insert
  to authenticated with check (
    bucket_id in ('business-media', 'menu-media')
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      else false
    end
  );
create policy "members update business media" on storage.objects for update
  to authenticated
  using (
    bucket_id in ('business-media', 'menu-media')
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      else false
    end
  )
  with check (
    bucket_id in ('business-media', 'menu-media')
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      else false
    end
  );
create policy "members delete business media" on storage.objects for delete
  to authenticated using (
    bucket_id in ('business-media', 'menu-media')
    and case
      when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then public.has_business_permission(((storage.foldername(name))[1])::uuid, 'business.profile.write')
      else false
    end
  );
