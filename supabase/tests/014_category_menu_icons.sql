-- Transactional category-icon validation, compatibility, permissions, and public exposure.
-- Run after Drizzle 0009 and Supabase 014. All fixtures are rolled back.

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
  begin
    execute statement;
    raise exception 'Expected statement to fail: %', statement;
  exception when others then
    if sqlerrm like 'Expected statement to fail:%' then raise; end if;
    if position(lower(expected_message) in lower(sqlerrm)) = 0 then
      raise exception 'Expected error containing "%", received "%"', expected_message, sqlerrm;
    end if;
  end;
end;
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  ('14000000-0000-0000-0000-' || lpad(number::text, 12, '0'))::uuid,
  'authenticated', 'authenticated', 'category-icon-' || number || '@example.com', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', 'Category icon role ' || number), now(), now()
from generate_series(31, 35) number;

insert into public.businesses (id, owner_id, name, slug, status, is_published) values
  ('24000000-0000-0000-0000-000000000031', '14000000-0000-0000-0000-000000000031', 'Icon business A', 'icon-business-a', 'active', true),
  ('24000000-0000-0000-0000-000000000032', '14000000-0000-0000-0000-000000000035', 'Icon business B', 'icon-business-b', 'active', false);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('24000000-0000-0000-0000-000000000031', '14000000-0000-0000-0000-000000000031', 'owner', 'active'),
  ('24000000-0000-0000-0000-000000000031', '14000000-0000-0000-0000-000000000032', 'admin', 'active'),
  ('24000000-0000-0000-0000-000000000031', '14000000-0000-0000-0000-000000000033', 'manager', 'active'),
  ('24000000-0000-0000-0000-000000000031', '14000000-0000-0000-0000-000000000034', 'viewer', 'active'),
  ('24000000-0000-0000-0000-000000000032', '14000000-0000-0000-0000-000000000035', 'owner', 'active');

insert into public.menu_items (business_id, category_id, name, description, price, is_available)
values (
  '24000000-0000-0000-0000-000000000031',
  (select id from public.menu_categories where business_id='24000000-0000-0000-0000-000000000031' and name='Coffee'),
  'Filter coffee', 'Freshly brewed', 3.25, true
);

select pg_temp.assert_true(
  (select icon_key='coffee' from public.menu_categories where business_id='24000000-0000-0000-0000-000000000031' and name='Coffee'),
  'starter categories receive their configured icon'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000031","role":"authenticated"}', true);
select public.save_menu_category('24000000-0000-0000-0000-000000000031', null, 'Lunch', 'meal', false);
select pg_temp.assert_true(
  (select icon_key='meal' from public.menu_categories where business_id='24000000-0000-0000-0000-000000000031' and name='Lunch'),
  'owner saves a category icon atomically'
);
select pg_temp.assert_throws(
  $$select public.save_menu_category('24000000-0000-0000-0000-000000000031', null, 'Unknown icon', 'cutlery', false)$$,
  'icon is invalid'
);

-- The pre-icon wrapper retains an edited category icon.
select public.save_menu_category(
  '24000000-0000-0000-0000-000000000031',
  (select id from public.menu_categories where business_id='24000000-0000-0000-0000-000000000031' and name='Lunch'),
  'Lunch menu', false
);
select pg_temp.assert_true(
  (select icon_key='meal' from public.menu_categories where business_id='24000000-0000-0000-0000-000000000031' and name='Lunch menu'),
  'compatibility wrapper preserves the current icon'
);

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000032","role":"authenticated"}', true);
select public.save_menu_category(
  '24000000-0000-0000-0000-000000000031',
  (select id from public.menu_categories where business_id='24000000-0000-0000-0000-000000000031' and name='Lunch menu'),
  'Lunch menu', 'healthy', false
);

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000033","role":"authenticated"}', true);
select public.save_menu_category('24000000-0000-0000-0000-000000000031', null, 'Sandwiches', 'sandwich', false);

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000034","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select public.save_menu_category('24000000-0000-0000-0000-000000000031', null, 'Viewer category', 'other', false)$$,
  'permission'
);
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-000000000035","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select public.save_menu_category('24000000-0000-0000-0000-000000000031', null, 'Cross business', 'other', false)$$,
  'permission'
);

reset role;
set local role anon;
select pg_temp.assert_true(
  exists(
    select 1 from public.get_public_business_menu('24000000-0000-0000-0000-000000000031')
    where item_name='Filter coffee' and category_icon_key='coffee'
  ),
  'public menu safely exposes the category icon'
);
select pg_temp.assert_throws(
  $$select public.save_menu_category('24000000-0000-0000-0000-000000000031', null, 'Anonymous category', 'other', false)$$,
  'permission denied'
);

rollback;
