-- Transactional UK legal-profile permission, lifecycle, audit, and application-seeding tests.
-- Run after drizzle/0005_uk_legal_profiles.sql and supabase/migrations/008_uk_legal_profiles.sql.

begin;

create or replace function pg_temp.assert_true(result boolean, message text)
returns void language plpgsql as $$
begin
  if not coalesce(result, false) then raise exception 'Assertion failed: %', message; end if;
end;
$$;

create or replace function pg_temp.assert_throws(statement text, expected_message text)
returns void language plpgsql as $$
begin
  execute statement;
  raise exception 'Expected statement to fail: %', statement;
exception when others then
  if sqlerrm = 'Expected statement to fail: ' || statement then raise; end if;
  if position(lower(expected_message) in lower(sqlerrm)) = 0 then
    raise exception 'Expected error containing "%", received "%"', expected_message, sqlerrm;
  end if;
end;
$$;

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('14000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'legal-owner@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Owner"}', now(), now()),
  ('14000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'legal-admin@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Admin"}', now(), now()),
  ('14000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'legal-finance@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Finance"}', now(), now()),
  ('14000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'legal-manager@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Manager"}', now(), now()),
  ('14000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'legal-barista@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Barista"}', now(), now()),
  ('14000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'legal-viewer@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Viewer"}', now(), now()),
  ('14000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'legal-suspended@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Suspended"}', now(), now()),
  ('14000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'legal-applicant@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Applicant"}', now(), now()),
  ('14000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'legal-platform@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Legal Platform"}', now(), now());

insert into public.businesses (id, owner_id, name, slug, status, is_published) values
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'Legal Test Coffee', 'legal-test-coffee', 'active', true),
  ('24000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001', 'Other Legal Coffee', 'other-legal-coffee', 'active', false);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000002', 'admin', 'active'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000003', 'finance', 'active'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000004', 'manager', 'active'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000005', 'barista', 'active'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000006', 'viewer', 'active'),
  ('24000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000007', 'finance', 'suspended'),
  ('24000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001', 'owner', 'active');

insert into public.platform_admins (profile_id) values ('14000000-0000-0000-0000-000000000009');

set local role anon;
select set_config('request.jwt.claims', '{}', true);
select pg_temp.assert_true(
  (select count(*) = 0 from public.business_legal_profiles where business_id = '24000000-0000-0000-0000-000000000001'),
  'anonymous users cannot see legal profile rows through RLS'
);
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000001')$q$, 'access required');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select pg_temp.assert_true((select count(*) = 1 from public.business_legal_profiles where business_id = '24000000-0000-0000-0000-000000000001'), 'finance can read its legal profile');
select public.save_business_legal_profile(
  '24000000-0000-0000-0000-000000000001', 1,
  '{"entity_type":"limited_company","legal_name":"Legal Test Coffee Limited","trading_name":"Legal Test Coffee","registered_address_line1":"10 High Street","registered_address_line2":"","registered_town_city":"London","registered_county":"","registered_postcode":"SW1A 1AA","contact_email":"finance@example.com","contact_phone":"+44 20 7946 0958","company_number":"12345678","charity_number":"","vat_registered":true,"vat_number":"GB123456789","last_edited_by":"14000000-0000-0000-0000-000000000001"}'::jsonb
);
select pg_temp.assert_true(
  (select revision = 2 and last_edited_by = '14000000-0000-0000-0000-000000000003' from public.business_legal_profiles where business_id = '24000000-0000-0000-0000-000000000001'),
  'save derives the editor identity and increments revision'
);
select pg_temp.assert_throws($q$select public.save_business_legal_profile('24000000-0000-0000-0000-000000000001', 1, '{"entity_type":"sole_trader"}'::jsonb)$q$, 'refresh before saving');
select pg_temp.assert_throws($q$select public.approve_business_legal_profile('24000000-0000-0000-0000-000000000001', 2, true)$q$, 'approval access required');
select public.submit_business_legal_profile('24000000-0000-0000-0000-000000000001', 2);

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000001')$q$, 'access required');
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000001')$q$, 'access required');
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000001')$q$, 'access required');
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000001')$q$, 'access required');
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000008","role":"authenticated"}', true);
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000001')$q$, 'access required');
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000009","role":"authenticated"}', true);
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000001')$q$, 'access required');

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select public.request_business_legal_profile_changes('24000000-0000-0000-0000-000000000001', 3, 'Confirm the registered trading name');
select pg_temp.assert_true((select status = 'draft' and change_request_note <> '' from public.business_legal_profiles where business_id = '24000000-0000-0000-0000-000000000001'), 'admin can return a submission for changes');

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select public.submit_business_legal_profile('24000000-0000-0000-0000-000000000001', 4);

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select pg_temp.assert_throws($q$select public.approve_business_legal_profile('24000000-0000-0000-0000-000000000001', 5, false)$q$, 'attestation is required');
select public.approve_business_legal_profile('24000000-0000-0000-0000-000000000001', 5, true);
select pg_temp.assert_true((select status = 'approved' and approved_by = '14000000-0000-0000-0000-000000000001' from public.business_legal_profiles where business_id = '24000000-0000-0000-0000-000000000001'), 'owner can attest and approve');

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select public.save_business_legal_profile(
  '24000000-0000-0000-0000-000000000001', 6,
  '{"entity_type":"limited_company","legal_name":"Legal Test Coffee Limited","trading_name":"Legal Test Coffee Updated","registered_address_line1":"10 High Street","registered_address_line2":"","registered_town_city":"London","registered_county":"","registered_postcode":"SW1A 1AA","contact_email":"finance@example.com","contact_phone":"+44 20 7946 0958","company_number":"12345678","charity_number":"","vat_registered":true,"vat_number":"GB123456789"}'::jsonb
);
select pg_temp.assert_true((select status = 'draft' and approved_by is null and approved_at is null from public.business_legal_profiles where business_id = '24000000-0000-0000-0000-000000000001'), 'editing approved data invalidates approval');
select pg_temp.assert_throws($q$select public.get_business_legal_profile('24000000-0000-0000-0000-000000000002')$q$, 'access required');

reset role;
select pg_temp.assert_true(
  (select count(*) >= 6 and bool_and(metadata::text not like '%Legal Test Coffee Limited%') from public.business_audit_logs where business_id = '24000000-0000-0000-0000-000000000001' and action like 'legal_profile.%'),
  'lifecycle events are audited without copying legal values'
);

-- The replaced application-review function must seed a private legal draft atomically.
insert into public.business_applications (
  id, applicant_id, status, trading_name, legal_name, description, category,
  contact_email, contact_phone, website_url, address, company_number, vat_number, submitted_at
) values (
  '34000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000008', 'submitted',
  'Seeded Coffee', 'Seeded Coffee Limited', '', 'Coffee shop', 'seeded@example.com', '+44 20 7000 0000', '',
  '20 Seed Street, London SW1A 2AA', 'SC123456', '123456789', now()
);
create temporary table seeded_business as
select public.review_business_application('34000000-0000-0000-0000-000000000001', true, null) as id;
select pg_temp.assert_true(
  (select legal.status = 'draft' and legal.legal_name = 'Seeded Coffee Limited' and legal.company_number = 'SC123456' and legal.vat_number = 'GB123456789'
   from public.business_legal_profiles legal join seeded_business seeded on seeded.id = legal.business_id),
  'approved applications seed a durable legal draft'
);

rollback;
