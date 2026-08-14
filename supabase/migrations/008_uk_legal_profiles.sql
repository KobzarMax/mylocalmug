-- UK business legal profiles, permission-safe approval workflow, and application seeding.
-- Apply after drizzle/0005_uk_legal_profiles.sql and supabase/migrations/007_public_marketplace.sql.

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
      'payments.connect', 'analytics.read', 'legal.read', 'legal.write'
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

alter table public.business_legal_profiles enable row level security;

create or replace function public.handle_new_business_legal_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.business_legal_profiles (business_id, trading_name, registered_address_line1, contact_email, contact_phone)
  values (
    new.id, left(new.name, 120), left(new.address, 160),
    case when lower(new.contact_email) ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then lower(new.contact_email) else '' end,
    case when new.contact_phone ~ '^[+]?[0-9 ()-]{7,25}$' then left(new.contact_phone, 30) else '' end
  )
  on conflict (business_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_business_created_create_legal_profile on public.businesses;
create trigger on_business_created_create_legal_profile
after insert on public.businesses
for each row execute function public.handle_new_business_legal_profile();

create policy "authorised members read legal profiles"
on public.business_legal_profiles for select
using (public.has_business_permission(business_id, 'legal.read'));

-- Existing businesses receive a private draft. Application data is used only where it exists.
insert into public.business_legal_profiles (
  business_id, entity_type, legal_name, trading_name, registered_address_line1,
  contact_email, contact_phone, company_number, vat_registered, vat_number
)
select
  business.id,
  case when upper(regexp_replace(coalesce(application.company_number, ''), '[^A-Za-z0-9]', '', 'g')) ~ '^([0-9]{8}|[A-Z]{2}[0-9]{6})$'
    then 'limited_company'::public.uk_legal_entity_type
    else 'other_organisation'::public.uk_legal_entity_type
  end,
  left(coalesce(application.legal_name, ''), 160),
  left(business.name, 120),
  left(coalesce(nullif(application.address, ''), business.address), 160),
  case when lower(coalesce(nullif(application.contact_email, ''), business.contact_email)) ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    then lower(coalesce(nullif(application.contact_email, ''), business.contact_email)) else '' end,
  case when coalesce(nullif(application.contact_phone, ''), business.contact_phone) ~ '^[+]?[0-9 ()-]{7,25}$'
    then left(coalesce(nullif(application.contact_phone, ''), business.contact_phone), 30) else '' end,
  case when upper(regexp_replace(coalesce(application.company_number, ''), '[^A-Za-z0-9]', '', 'g')) ~ '^([0-9]{8}|[A-Z]{2}[0-9]{6})$'
    then upper(regexp_replace(application.company_number, '[^A-Za-z0-9]', '', 'g')) else '' end,
  regexp_replace(coalesce(application.vat_number, ''), '[^0-9]', '', 'g') ~ '^[0-9]{9}([0-9]{3})?$',
  case when regexp_replace(coalesce(application.vat_number, ''), '[^0-9]', '', 'g') ~ '^[0-9]{9}([0-9]{3})?$'
    then 'GB' || regexp_replace(application.vat_number, '[^0-9]', '', 'g') else '' end
from public.businesses business
left join public.business_applications application
  on application.applicant_id = business.owner_id and application.status = 'approved'
on conflict (business_id) do nothing;

create or replace function public.legal_profile_is_complete(profile public.business_legal_profiles)
returns boolean language sql immutable set search_path = public
as $$
  select
    profile.country = 'GB'
    and char_length(btrim(profile.legal_name)) between 2 and 160
    and char_length(btrim(profile.trading_name)) between 2 and 120
    and char_length(btrim(profile.registered_address_line1)) between 3 and 160
    and char_length(btrim(profile.registered_town_city)) between 2 and 100
    and profile.registered_postcode ~ '^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2})$'
    and profile.contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    and profile.contact_phone ~ '^[+]?[0-9 ()-]{7,25}$'
    and (
      profile.entity_type not in ('limited_company', 'limited_liability_partnership')
      or profile.company_number ~ '^([0-9]{8}|[A-Z]{2}[0-9]{6})$'
    )
    and (profile.entity_type <> 'charity' or profile.charity_number ~ '^([0-9]{6,8}(-[0-9]{1,2})?|[A-Z]{2}[0-9]{6})$')
    and (not profile.vat_registered or profile.vat_number ~ '^GB[0-9]{9}([0-9]{3})?$');
$$;

create or replace function public.get_business_legal_profile(target_business_id uuid)
returns public.business_legal_profiles
language plpgsql stable security definer set search_path = public
as $$
declare
  result public.business_legal_profiles;
begin
  if not public.has_business_permission(target_business_id, 'legal.read') then
    raise exception 'Legal profile access required';
  end if;
  select * into result from public.business_legal_profiles where business_id = target_business_id;
  if result.business_id is null then raise exception 'Legal profile not found'; end if;
  return result;
end;
$$;

create or replace function public.save_business_legal_profile(
  target_business_id uuid,
  expected_revision integer,
  profile_input jsonb
)
returns public.business_legal_profiles
language plpgsql security definer set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  current_profile public.business_legal_profiles;
  result public.business_legal_profiles;
  next_entity public.uk_legal_entity_type;
  next_company_number text;
  next_charity_number text;
  next_vat_registered boolean;
  next_vat_number text;
  changed_fields text[];
begin
  if caller_id is null or not public.has_business_permission(target_business_id, 'legal.write') then
    raise exception 'Legal profile edit access required';
  end if;

  select * into current_profile
  from public.business_legal_profiles
  where business_id = target_business_id
  for update;
  if current_profile.business_id is null then raise exception 'Legal profile not found'; end if;
  if current_profile.revision <> expected_revision then raise exception 'Legal profile changed. Refresh before saving'; end if;

  next_entity := (profile_input ->> 'entity_type')::public.uk_legal_entity_type;
  next_company_number := case when next_entity in ('limited_company', 'limited_liability_partnership')
    then upper(regexp_replace(coalesce(profile_input ->> 'company_number', ''), '[^A-Za-z0-9]', '', 'g')) else '' end;
  next_charity_number := case when next_entity = 'charity'
    then upper(regexp_replace(coalesce(profile_input ->> 'charity_number', ''), '[^A-Za-z0-9-]', '', 'g')) else '' end;
  next_vat_registered := coalesce((profile_input ->> 'vat_registered')::boolean, false);
  next_vat_number := case when next_vat_registered then
    'GB' || regexp_replace(upper(coalesce(profile_input ->> 'vat_number', '')), '[^0-9]', '', 'g') else '' end;

  changed_fields := array_remove(array[
    case when current_profile.entity_type is distinct from next_entity then 'entityType' end,
    case when current_profile.legal_name is distinct from btrim(coalesce(profile_input ->> 'legal_name', '')) then 'legalName' end,
    case when current_profile.trading_name is distinct from btrim(coalesce(profile_input ->> 'trading_name', '')) then 'tradingName' end,
    case when current_profile.registered_address_line1 is distinct from btrim(coalesce(profile_input ->> 'registered_address_line1', '')) then 'registeredAddress' end,
    case when current_profile.registered_address_line2 is distinct from btrim(coalesce(profile_input ->> 'registered_address_line2', '')) then 'registeredAddressLine2' end,
    case when current_profile.registered_town_city is distinct from btrim(coalesce(profile_input ->> 'registered_town_city', '')) then 'registeredTownCity' end,
    case when current_profile.registered_county is distinct from btrim(coalesce(profile_input ->> 'registered_county', '')) then 'registeredCounty' end,
    case when current_profile.registered_postcode is distinct from upper(btrim(coalesce(profile_input ->> 'registered_postcode', ''))) then 'registeredPostcode' end,
    case when current_profile.contact_email is distinct from lower(btrim(coalesce(profile_input ->> 'contact_email', ''))) then 'contactEmail' end,
    case when current_profile.contact_phone is distinct from btrim(coalesce(profile_input ->> 'contact_phone', '')) then 'contactPhone' end,
    case when current_profile.company_number is distinct from next_company_number then 'companyNumber' end,
    case when current_profile.charity_number is distinct from next_charity_number then 'charityNumber' end,
    case when current_profile.vat_registered is distinct from next_vat_registered or current_profile.vat_number is distinct from next_vat_number then 'vatRegistration' end
  ], null);

  update public.business_legal_profiles set
    entity_type = next_entity,
    legal_name = btrim(coalesce(profile_input ->> 'legal_name', '')),
    trading_name = btrim(coalesce(profile_input ->> 'trading_name', '')),
    registered_address_line1 = btrim(coalesce(profile_input ->> 'registered_address_line1', '')),
    registered_address_line2 = btrim(coalesce(profile_input ->> 'registered_address_line2', '')),
    registered_town_city = btrim(coalesce(profile_input ->> 'registered_town_city', '')),
    registered_county = btrim(coalesce(profile_input ->> 'registered_county', '')),
    registered_postcode = regexp_replace(
      upper(regexp_replace(coalesce(profile_input ->> 'registered_postcode', ''), '[[:space:]]', '', 'g')),
      '(.+)(...)$', '\1 \2'
    ),
    contact_email = lower(btrim(coalesce(profile_input ->> 'contact_email', ''))),
    contact_phone = btrim(coalesce(profile_input ->> 'contact_phone', '')),
    company_number = next_company_number,
    charity_number = next_charity_number,
    vat_registered = next_vat_registered,
    vat_number = next_vat_number,
    status = 'draft',
    revision = revision + 1,
    change_request_note = '',
    last_edited_by = caller_id,
    submitted_by = null,
    submitted_at = null,
    approved_by = null,
    approved_at = null,
    updated_at = now()
  where business_id = target_business_id
  returning * into result;

  insert into public.business_audit_logs (business_id, actor_id, action, metadata)
  values (target_business_id, caller_id, 'legal_profile.saved', jsonb_build_object(
    'revision', result.revision, 'changedFields', to_jsonb(changed_fields),
    'approvalInvalidated', current_profile.status = 'approved'
  ));
  return result;
end;
$$;

create or replace function public.submit_business_legal_profile(target_business_id uuid, expected_revision integer)
returns public.business_legal_profiles
language plpgsql security definer set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  result public.business_legal_profiles;
begin
  if caller_id is null or not public.has_business_permission(target_business_id, 'legal.write') then
    raise exception 'Legal profile edit access required';
  end if;
  select * into result from public.business_legal_profiles where business_id = target_business_id for update;
  if result.business_id is null then raise exception 'Legal profile not found'; end if;
  if result.revision <> expected_revision then raise exception 'Legal profile changed. Refresh before submitting'; end if;
  if result.status <> 'draft' then raise exception 'Only a draft can be submitted'; end if;
  if not public.legal_profile_is_complete(result) then raise exception 'Complete all required legal information before submitting'; end if;

  update public.business_legal_profiles set status = 'pending_approval', revision = revision + 1,
    submitted_by = caller_id, submitted_at = now(), change_request_note = '', updated_at = now()
  where business_id = target_business_id returning * into result;
  insert into public.business_audit_logs (business_id, actor_id, action, metadata)
  values (target_business_id, caller_id, 'legal_profile.submitted', jsonb_build_object('revision', result.revision));
  return result;
end;
$$;

create or replace function public.approve_business_legal_profile(
  target_business_id uuid,
  expected_revision integer,
  authority_attested boolean
)
returns public.business_legal_profiles
language plpgsql security definer set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  result public.business_legal_profiles;
begin
  if caller_id is null or not public.has_business_permission(target_business_id, 'legal.approve') then
    raise exception 'Legal profile approval access required';
  end if;
  if authority_attested is not true then raise exception 'Authority and accuracy attestation is required'; end if;
  select * into result from public.business_legal_profiles where business_id = target_business_id for update;
  if result.business_id is null then raise exception 'Legal profile not found'; end if;
  if result.revision <> expected_revision then raise exception 'Legal profile changed. Refresh before approving'; end if;
  if result.status <> 'pending_approval' then raise exception 'Only a submitted profile can be approved'; end if;
  if not public.legal_profile_is_complete(result) then raise exception 'Legal profile is incomplete'; end if;

  update public.business_legal_profiles set status = 'approved', revision = revision + 1,
    approved_by = caller_id, approved_at = now(), change_request_note = '', updated_at = now()
  where business_id = target_business_id returning * into result;
  insert into public.business_audit_logs (business_id, actor_id, action, metadata)
  values (target_business_id, caller_id, 'legal_profile.approved', jsonb_build_object(
    'revision', result.revision, 'authorityAttested', true
  ));
  return result;
end;
$$;

create or replace function public.request_business_legal_profile_changes(
  target_business_id uuid,
  expected_revision integer,
  review_note text
)
returns public.business_legal_profiles
language plpgsql security definer set search_path = public
as $$
declare
  caller_id uuid := (select auth.uid());
  result public.business_legal_profiles;
  clean_note text := btrim(coalesce(review_note, ''));
begin
  if caller_id is null or not public.has_business_permission(target_business_id, 'legal.approve') then
    raise exception 'Legal profile approval access required';
  end if;
  if char_length(clean_note) not between 3 and 1000 then raise exception 'Explain what needs to change'; end if;
  select * into result from public.business_legal_profiles where business_id = target_business_id for update;
  if result.business_id is null then raise exception 'Legal profile not found'; end if;
  if result.revision <> expected_revision then raise exception 'Legal profile changed. Refresh before reviewing'; end if;
  if result.status <> 'pending_approval' then raise exception 'Only a submitted profile can be returned'; end if;

  update public.business_legal_profiles set status = 'draft', revision = revision + 1,
    change_request_note = clean_note, submitted_by = null, submitted_at = null,
    approved_by = null, approved_at = null, updated_at = now()
  where business_id = target_business_id returning * into result;
  insert into public.business_audit_logs (business_id, actor_id, action, metadata)
  values (target_business_id, caller_id, 'legal_profile.changes_requested', jsonb_build_object(
    'revision', result.revision, 'noteProvided', true
  ));
  return result;
end;
$$;

-- New approvals seed the same durable draft atomically with business creation.
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
  if session_user <> 'postgres' and not public.is_platform_admin() then raise exception 'Platform administrator access required'; end if;
  select * into application from public.business_applications
  where id = target_application_id and status in ('submitted', 'under_review') for update;
  if application.id is null then raise exception 'Application is not reviewable'; end if;
  if not approve then
    update public.business_applications set status = 'rejected', rejection_reason = nullif(btrim(review_reason), ''),
      reviewed_at = now(), updated_at = now() where id = application.id;
    return null;
  end if;

  created_slug := trim(both '-' from regexp_replace(lower(application.trading_name), '[^a-z0-9]+', '-', 'g'))
    || '-' || left(replace(application.id::text, '-', ''), 8);
  insert into public.businesses (
    owner_id, name, slug, description, address, category, contact_email, contact_phone,
    website_url, status, is_published
  ) values (
    application.applicant_id, application.trading_name, created_slug, application.description,
    application.address, application.category, application.contact_email, application.contact_phone,
    application.website_url, 'onboarding', false
  ) returning id into created_business_id;
  insert into public.business_memberships (business_id, profile_id, role, status)
  values (created_business_id, application.applicant_id, 'owner', 'active');
  insert into public.business_locations (business_id, name, address, phone, is_primary)
  values (created_business_id, 'Main location', application.address, application.contact_phone, true);
  insert into public.business_legal_profiles (
    business_id, entity_type, legal_name, trading_name, registered_address_line1,
    contact_email, contact_phone, company_number, vat_registered, vat_number
  ) values (
    created_business_id,
    case when upper(regexp_replace(coalesce(application.company_number, ''), '[^A-Za-z0-9]', '', 'g')) ~ '^([0-9]{8}|[A-Z]{2}[0-9]{6})$'
      then 'limited_company'::public.uk_legal_entity_type else 'other_organisation'::public.uk_legal_entity_type end,
    left(application.legal_name, 160), left(application.trading_name, 120), left(application.address, 160),
    case when lower(application.contact_email) ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then lower(application.contact_email) else '' end,
    case when application.contact_phone ~ '^[+]?[0-9 ()-]{7,25}$' then left(application.contact_phone, 30) else '' end,
    case when upper(regexp_replace(coalesce(application.company_number, ''), '[^A-Za-z0-9]', '', 'g')) ~ '^([0-9]{8}|[A-Z]{2}[0-9]{6})$'
      then upper(regexp_replace(application.company_number, '[^A-Za-z0-9]', '', 'g')) else '' end,
    regexp_replace(coalesce(application.vat_number, ''), '[^0-9]', '', 'g') ~ '^[0-9]{9}([0-9]{3})?$',
    case when regexp_replace(coalesce(application.vat_number, ''), '[^0-9]', '', 'g') ~ '^[0-9]{9}([0-9]{3})?$'
      then 'GB' || regexp_replace(application.vat_number, '[^0-9]', '', 'g') else '' end
  ) on conflict (business_id) do update set
    entity_type = excluded.entity_type,
    legal_name = excluded.legal_name,
    trading_name = excluded.trading_name,
    registered_address_line1 = excluded.registered_address_line1,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    company_number = excluded.company_number,
    vat_registered = excluded.vat_registered,
    vat_number = excluded.vat_number,
    updated_at = now();
  update public.business_applications set status = 'approved', reviewed_at = now(),
    rejection_reason = null, updated_at = now() where id = application.id;
  return created_business_id;
end;
$$;

revoke all on function public.legal_profile_is_complete(public.business_legal_profiles) from public;
revoke all on function public.handle_new_business_legal_profile() from public;
revoke all on function public.get_business_legal_profile(uuid) from public;
revoke all on function public.save_business_legal_profile(uuid, integer, jsonb) from public;
revoke all on function public.submit_business_legal_profile(uuid, integer) from public;
revoke all on function public.approve_business_legal_profile(uuid, integer, boolean) from public;
revoke all on function public.request_business_legal_profile_changes(uuid, integer, text) from public;
grant execute on function public.get_business_legal_profile(uuid) to authenticated;
grant execute on function public.save_business_legal_profile(uuid, integer, jsonb) to authenticated;
grant execute on function public.submit_business_legal_profile(uuid, integer) to authenticated;
grant execute on function public.approve_business_legal_profile(uuid, integer, boolean) to authenticated;
grant execute on function public.request_business_legal_profile_changes(uuid, integer, text) to authenticated;
grant select on table public.business_legal_profiles to authenticated;
