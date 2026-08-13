-- Transactional RLS and lifecycle checks for supabase/migrations/005_news_events.sql.
-- Run after Drizzle 0004 and Supabase 005. Every fixture is rolled back.

begin;

create or replace function pg_temp.assert_true(result boolean, message text)
returns void language plpgsql as $$
begin
  if not coalesce(result, false) then raise exception 'Assertion failed: %', message; end if;
end;
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('12000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'content-owner@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Owner"}', now(), now()),
  ('12000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'content-admin@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Admin"}', now(), now()),
  ('12000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'content-manager@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Manager"}', now(), now()),
  ('12000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'content-finance@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Finance"}', now(), now()),
  ('12000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'content-barista@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Barista"}', now(), now()),
  ('12000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'content-viewer@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Viewer"}', now(), now()),
  ('12000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'content-customer@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Customer"}', now(), now()),
  ('12000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'content-applicant@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Applicant"}', now(), now()),
  ('12000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated', 'content-platform@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Content Platform"}', now(), now());

insert into public.businesses (id, owner_id, name, slug, is_published) values
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'Published Content Shop', 'published-content-shop', true),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000001', 'Draft Content Shop', 'draft-content-shop', false);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000002', 'admin', 'active'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000003', 'manager', 'active'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000004', 'finance', 'active'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000005', 'barista', 'active'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000006', 'viewer', 'active'),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000001', 'owner', 'active');
insert into public.platform_admins (profile_id) values ('12000000-0000-0000-0000-000000000009');
insert into public.business_applications (applicant_id, trading_name, contact_email, address)
values ('12000000-0000-0000-0000-000000000008', 'Applicant Shop', 'content-applicant@example.com', '1 Test Street');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select set_config('test.event_id', public.save_business_content(
  null,
  '22000000-0000-0000-0000-000000000001',
  'event',
  'Community cupping evening',
  'Taste three local roasts with the team.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Everyone is welcome."}]}]}'::jsonb,
  'Everyone is welcome.',
  null,
  true,
  now() + interval '15 days',
  now() + interval '15 days 2 hours',
  false,
  'Europe/London',
  'Published Content Shop',
  '1 Coffee Street',
  array[10080, 1440, 60]
)::text, true);
select public.set_business_content_publication(current_setting('test.event_id')::uuid, now());

-- Audit identities and the private outbox are intentionally unavailable to app roles.
-- Inspect them as the migration/test runner, then restore the owner JWT context.
reset role;
select pg_temp.assert_true(
  (select created_by = '12000000-0000-0000-0000-000000000001'::uuid
     and author_display_name = 'Content Owner'
   from public.posts where id = current_setting('test.event_id')::uuid),
  'owner identity and public byline must come from auth.uid()'
);
select pg_temp.assert_true(
  (select count(*) = 3 from public.event_notification_jobs
   where post_id = current_setting('test.event_id')::uuid and status = 'pending'),
  'publishing should create all future reminder jobs'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select set_config('test.scheduled_id', public.save_business_content(
  null, '22000000-0000-0000-0000-000000000001', 'news', 'Scheduled summer menu',
  'A preview of the new summer menu.', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Coming soon."}]}]}'::jsonb,
  'Coming soon.', null, false, null, null, false, null, null, null, '{}'
)::text, true);
select public.set_business_content_publication(current_setting('test.scheduled_id')::uuid, now() + interval '1 day');

-- Administrators can create and remove drafts through the trusted lifecycle functions.
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select set_config('test.admin_draft_id', public.save_business_content(
  null, '22000000-0000-0000-0000-000000000001', 'news', 'Administrator draft',
  'A draft created by an administrator.', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Draft body."}]}]}'::jsonb,
  'Draft body.', null, false, null, null, false, null, null, null, '{}'
)::text, true);
select public.delete_business_content_draft(current_setting('test.admin_draft_id')::uuid);

-- Anonymous users see only content already published by a published business.
set local role anon;
select set_config('request.jwt.claims', '{}', true);
select pg_temp.assert_true((select count(id) = 1 from public.posts), 'anonymous users should only read due published content');
select pg_temp.assert_true(
  (select count(*) = 1 from public.get_public_content_feed(null, null, null, false, null, null, null, 20)),
  'public feed should not leak drafts or scheduled content'
);

-- Customers can follow, opt out, and receive only followed-shop feed records.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
insert into public.business_followers (business_id, client_id)
values ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000007');
update public.business_followers set event_notifications_enabled = false
where business_id = '22000000-0000-0000-0000-000000000001';
select pg_temp.assert_true(
  (select not event_notifications_enabled from public.business_followers
   where business_id = '22000000-0000-0000-0000-000000000001'),
  'customer should update only their shop notification preference'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.get_public_content_feed(null, null, null, true, null, null, null, 20)),
  'followed-only feed should contain followed published shops'
);
select pg_temp.assert_true(
  public.register_push_device('ExpoPushToken[content-test-token]', 'ios') is not null,
  'customer should register an owned push device'
);

-- Manager edits coalesce update notices and rebuild reminders under a new version.
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.save_business_content(
      null, '22000000-0000-0000-0000-000000000002', 'news', 'Cross business draft',
      'This write must be rejected.', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Denied."}]}]}'::jsonb,
      'Denied.', null, false, null, null, false, null, null, null, '{}'
    );
    raise exception 'manager unexpectedly wrote cross-business content';
  exception when others then
    if sqlerrm = 'manager unexpectedly wrote cross-business content' then raise; end if;
  end;
end;
$$;
select public.save_business_content(
  current_setting('test.event_id')::uuid, '22000000-0000-0000-0000-000000000001', 'event',
  'Community cupping night', 'Taste three local roasts with the team.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Everyone is welcome."}]}]}'::jsonb,
  'Everyone is welcome.', null, true, now() + interval '16 days', now() + interval '16 days 2 hours',
  false, 'Europe/London', 'Published Content Shop', '1 Coffee Street', array[10080, 1440, 60]
);
select public.save_business_content(
  current_setting('test.event_id')::uuid, '22000000-0000-0000-0000-000000000001', 'event',
  'Community cupping night — updated', 'Taste three local roasts with the team.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Everyone is welcome."}]}]}'::jsonb,
  'Everyone is welcome.', null, true, now() + interval '16 days', now() + interval '16 days 2 hours',
  false, 'Europe/London', 'Published Content Shop', '1 Coffee Street', array[1440, 60]
);
reset role;
select pg_temp.assert_true(
  (select count(*) = 1 from public.event_notification_jobs
   where post_id = current_setting('test.event_id')::uuid and job_type = 'updated' and status = 'pending'),
  'rapid published-event edits should leave one pending update alert'
);
select pg_temp.assert_true(
  (select count(*) = 2 from public.event_notification_jobs
   where post_id = current_setting('test.event_id')::uuid and job_type = 'reminder' and status = 'pending'),
  'edited reminder choices should replace pending reminder jobs'
);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}', true);

-- Finance, barista, viewer, applicant, platform admin, and suspended managers cannot mutate content.
do $$
declare forbidden_id text;
begin
  foreach forbidden_id in array array[
    '12000000-0000-0000-0000-000000000004',
    '12000000-0000-0000-0000-000000000005',
    '12000000-0000-0000-0000-000000000006',
    '12000000-0000-0000-0000-000000000008',
    '12000000-0000-0000-0000-000000000009'
  ] loop
    perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', forbidden_id), true);
    begin
      perform public.archive_business_content(current_setting('test.event_id')::uuid);
      raise exception 'forbidden role % unexpectedly archived content', forbidden_id;
    exception when others then
      if sqlerrm like 'forbidden role % unexpectedly archived content' then raise; end if;
    end;
  end loop;
end;
$$;

reset role;
update public.business_memberships set status = 'suspended'
where business_id = '22000000-0000-0000-0000-000000000001'
  and profile_id = '12000000-0000-0000-0000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.archive_business_content(current_setting('test.event_id')::uuid);
    raise exception 'suspended manager unexpectedly archived content';
  exception when others then
    if sqlerrm = 'suspended manager unexpectedly archived content' then raise; end if;
  end;
end;
$$;

-- Cancellation stops reminder jobs and creates exactly one cancellation alert.
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select public.cancel_business_event(current_setting('test.event_id')::uuid, 'The venue is unexpectedly unavailable.');
reset role;
select pg_temp.assert_true(
  (select count(*) = 0 from public.event_notification_jobs
   where post_id = current_setting('test.event_id')::uuid and job_type = 'reminder' and status = 'pending'),
  'cancellation should stop pending reminders'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.event_notification_jobs
   where post_id = current_setting('test.event_id')::uuid and job_type = 'cancelled' and status = 'pending'),
  'cancellation should create one notification job'
);

rollback;
