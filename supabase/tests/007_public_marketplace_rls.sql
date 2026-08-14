-- Transactional public marketplace and menu-visibility checks.
-- Run after supabase/migrations/007_public_marketplace.sql.

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
  ('13000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'market-owner@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Market Owner"}', now(), now()),
  ('13000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'market-manager@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Market Manager"}', now(), now()),
  ('13000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'market-viewer@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Market Viewer"}', now(), now()),
  ('13000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'market-customer@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Market Customer"}', now(), now());

insert into public.businesses (id, owner_id, name, slug, status, is_published, category, description) values
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'RLS007Fixture Market Coffee', 'rls007fixture-market-coffee', 'active', true, 'Speciality coffee', 'Published test shop'),
  ('23000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'RLS007Fixture Hidden Coffee', 'rls007fixture-hidden-coffee', 'active', false, 'Coffee shop', 'Unpublished test shop');

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000002', 'manager', 'active'),
  ('23000000-0000-0000-0000-000000000001', '13000000-0000-0000-0000-000000000003', 'viewer', 'active'),
  ('23000000-0000-0000-0000-000000000002', '13000000-0000-0000-0000-000000000001', 'owner', 'active');

insert into public.business_locations (id, business_id, name, address, timezone, is_primary) values
  ('33000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'Main shop', '1 Market Street', 'Europe/London', true);
insert into public.business_hours (location_id, day_of_week, opens_at, closes_at, is_closed)
values ('33000000-0000-0000-0000-000000000001', 0, '08:00', '17:00', false);

insert into public.menu_categories (id, business_id, name, sort_order) values
  ('43000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', 'Coffee', 0),
  ('43000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000002', 'Hidden', 0);
insert into public.menu_items (id, business_id, category_id, name, description, price, is_available) values
  ('53000000-0000-0000-0000-000000000001', '23000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 'RLS007Available Flat White', 'Available drink', 3.60, true),
  ('53000000-0000-0000-0000-000000000002', '23000000-0000-0000-0000-000000000001', '43000000-0000-0000-0000-000000000001', 'RLS007Unavailable Secret Drink', 'Unavailable drink', 4.20, false),
  ('53000000-0000-0000-0000-000000000003', '23000000-0000-0000-0000-000000000002', '43000000-0000-0000-0000-000000000002', 'Hidden Drink', 'Unpublished drink', 4.00, true),
  ('53000000-0000-0000-0000-000000000004', '23000000-0000-0000-0000-000000000001', null, 'House Cake', 'Available uncategorized item', 3.20, true);

set local role anon;
select set_config('request.jwt.claims', '{}', true);
select pg_temp.assert_true(
  (select count(*) = 1 from public.get_public_business_catalog('RLS007Fixture Market Coffee', null, null, 20)
    where id = '23000000-0000-0000-0000-000000000001'),
  'anonymous catalog must return the active published fixture business'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.get_public_business_catalog('RLS007Available Flat White', null, null, 20)
    where id = '23000000-0000-0000-0000-000000000001'),
  'catalog search should match available menu item names'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.get_public_business_catalog('RLS007Unavailable Secret Drink', null, null, 20)
    where id = '23000000-0000-0000-0000-000000000001'),
  'catalog search must not match unavailable menu items'
);
select pg_temp.assert_true(
  (select count(*) = 2 from public.get_public_business_menu('23000000-0000-0000-0000-000000000001')),
  'public menu RPC must return categorized and uncategorized available items'
);
select pg_temp.assert_true(
  (select count(id) = 2 from public.menu_items
    where id in (
      '53000000-0000-0000-0000-000000000001',
      '53000000-0000-0000-0000-000000000002',
      '53000000-0000-0000-0000-000000000003',
      '53000000-0000-0000-0000-000000000004'
    )),
  'anonymous direct reads must hide unavailable and unpublished menu items'
);
select pg_temp.assert_true(
  (select count(*) = 0 from public.get_public_business_detail('23000000-0000-0000-0000-000000000002')),
  'unpublished business details must remain private'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select pg_temp.assert_true(
  (select count(id) = 2 from public.menu_items
    where id in (
      '53000000-0000-0000-0000-000000000001',
      '53000000-0000-0000-0000-000000000002',
      '53000000-0000-0000-0000-000000000003',
      '53000000-0000-0000-0000-000000000004'
    )),
  'customers must see only available items from published businesses'
);

select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select pg_temp.assert_true(
  (select count(id) = 3 from public.menu_items where business_id = '23000000-0000-0000-0000-000000000001'),
  'menu managers must see unavailable items for their own business'
);
select pg_temp.assert_true(
  (select count(id) = 0 from public.menu_items where business_id = '23000000-0000-0000-0000-000000000002'),
  'menu managers must not see items from an unpublished cross-business tenant'
);

select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select pg_temp.assert_true(
  (select count(id) = 2 from public.menu_items
    where id in (
      '53000000-0000-0000-0000-000000000001',
      '53000000-0000-0000-0000-000000000002',
      '53000000-0000-0000-0000-000000000003',
      '53000000-0000-0000-0000-000000000004'
    )),
  'viewers must receive the same public available-item visibility as customers'
);

rollback;
