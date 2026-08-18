-- Transactional category-management, duplicate, similarity, and permission checks.
-- Run after Drizzle 0008 and Supabase 012. Every fixture is rolled back.

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
  ('12000000-0000-0000-0000-' || lpad(number::text, 12, '0'))::uuid,
  'authenticated', 'authenticated', 'category-role-' || number || '@example.com', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', 'Category role ' || number), now(), now()
from generate_series(21, 28) number;

insert into public.businesses (id, owner_id, name, slug, is_published) values
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000021', 'Category business A', 'category-business-a', false),
  ('22000000-0000-0000-0000-000000000022', '12000000-0000-0000-0000-000000000028', 'Category business B', 'category-business-b', false);

-- Remove migration 011 starter rows so every category below is intentional.
delete from public.menu_categories
where business_id in (
  '22000000-0000-0000-0000-000000000021',
  '22000000-0000-0000-0000-000000000022'
);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000021', 'owner', 'active'),
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000022', 'admin', 'active'),
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000023', 'manager', 'active'),
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000024', 'finance', 'active'),
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000025', 'barista', 'active'),
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000026', 'viewer', 'active'),
  ('22000000-0000-0000-0000-000000000021', '12000000-0000-0000-0000-000000000027', 'manager', 'suspended'),
  ('22000000-0000-0000-0000-000000000022', '12000000-0000-0000-0000-000000000028', 'owner', 'active');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000021","role":"authenticated"}', true);

select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, '  Coffee  ', false);
select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Tea   & hot drinks', false);
select pg_temp.assert_true(
  (select name = 'Coffee' from public.menu_categories
   where business_id = '22000000-0000-0000-0000-000000000021' and lower(name) = 'coffee'),
  'save normalizes outer and repeated whitespace'
);
select pg_temp.assert_true(
  (select match_kind = 'exact' from public.check_menu_category_name(
    '22000000-0000-0000-0000-000000000021', ' coffee ', null
  ) limit 1),
  'case-insensitive normalized duplicates are exact matches'
);
select pg_temp.assert_throws(
  $$select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'COFFEE', true)$$,
  'already exists'
);
select pg_temp.assert_true(
  exists(select 1 from public.check_menu_category_name(
    '22000000-0000-0000-0000-000000000021', 'Coffees', null
  ) where match_kind = 'similar' and category_name = 'Coffee'),
  'trigram matching identifies a likely similar category'
);
select pg_temp.assert_throws(
  $$select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Coffees', false)$$,
  'similar category'
);
select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Coffees', true);

select pg_temp.assert_true(
  not exists(
    select 1 from public.check_menu_category_name(
      '22000000-0000-0000-0000-000000000021',
      'Coffee',
      (select id from public.menu_categories
       where business_id = '22000000-0000-0000-0000-000000000021' and name = 'Coffee')
    ) where match_kind = 'exact'
  ),
  'editing excludes the current category from exact matching'
);

select pg_temp.assert_throws(
  $$select public.reorder_menu_categories(
    '22000000-0000-0000-0000-000000000021',
    array[(select id from public.menu_categories where business_id='22000000-0000-0000-0000-000000000021' limit 1)]
  )$$,
  'every category exactly once'
);
select public.reorder_menu_categories(
  '22000000-0000-0000-0000-000000000021',
  (select array_agg(id order by name desc) from public.menu_categories
   where business_id = '22000000-0000-0000-0000-000000000021')
);
select pg_temp.assert_true(
  (select name = 'Tea & hot drinks' from public.menu_categories
   where business_id = '22000000-0000-0000-0000-000000000021'
   order by sort_order limit 1),
  'trusted reordering applies the complete supplied order'
);

insert into public.menu_items (business_id, category_id, name, price)
values (
  '22000000-0000-0000-0000-000000000021',
  (select id from public.menu_categories
   where business_id = '22000000-0000-0000-0000-000000000021' and name = 'Coffee'),
  'Flat white', 4.00
);
select public.delete_menu_category(
  '22000000-0000-0000-0000-000000000021',
  (select id from public.menu_categories
   where business_id = '22000000-0000-0000-0000-000000000021' and name = 'Coffee')
);
select pg_temp.assert_true(
  (select category_id is null from public.menu_items
   where business_id = '22000000-0000-0000-0000-000000000021' and name = 'Flat white'),
  'deleting a category preserves its items as uncategorized'
);

select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000022","role":"authenticated"}', true);
select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Admin category', false);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000023","role":"authenticated"}', true);
select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Manager category', false);

-- Direct table writes are no longer an alternative to trusted category RPCs.
select pg_temp.assert_throws(
  $$insert into public.menu_categories (business_id, name) values ('22000000-0000-0000-0000-000000000021', 'Direct write')$$,
  'permission denied'
);
select pg_temp.assert_throws(
  $$update public.menu_categories set name='Direct update' where business_id='22000000-0000-0000-0000-000000000021'$$,
  'permission denied'
);
select pg_temp.assert_throws(
  $$delete from public.menu_categories where business_id='22000000-0000-0000-0000-000000000021'$$,
  'permission denied'
);

-- Finance, barista, viewer, suspended manager, and cross-business owner are denied.
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000024","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Finance category', false)$$,
  'permission'
);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000025","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select * from public.check_menu_category_name('22000000-0000-0000-0000-000000000021', 'Coffee', null)$$,
  'permission'
);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000026","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select public.reorder_menu_categories('22000000-0000-0000-0000-000000000021', array[]::uuid[])$$,
  'permission'
);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000027","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Suspended category', false)$$,
  'permission'
);
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000028","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Cross-business category', false)$$,
  'permission'
);

reset role;
set local role anon;
select pg_temp.assert_throws(
  $$select * from public.check_menu_category_name('22000000-0000-0000-0000-000000000021', 'Coffee', null)$$,
  'permission denied'
);
select pg_temp.assert_throws(
  $$select public.save_menu_category('22000000-0000-0000-0000-000000000021', null, 'Anonymous category', false)$$,
  'permission denied'
);
select pg_temp.assert_throws(
  $$select public.reorder_menu_categories('22000000-0000-0000-0000-000000000021', array[]::uuid[])$$,
  'permission denied'
);
select pg_temp.assert_throws(
  $$select public.delete_menu_category('22000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001')$$,
  'permission denied'
);
select pg_temp.assert_throws(
  $$select public.add_default_menu_categories('22000000-0000-0000-0000-000000000021')$$,
  'permission denied'
);

rollback;
