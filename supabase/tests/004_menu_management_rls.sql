-- Transactional policy checks for supabase/migrations/004_menu_management.sql.
-- Run in Supabase SQL Editor after migration 004. Every test record is rolled back.

begin;

create or replace function pg_temp.assert_true(result boolean, message text)
returns void language plpgsql as $$
begin
  if not coalesce(result, false) then raise exception 'Assertion failed: %', message; end if;
end;
$$;

-- Auth users are required because profiles.id references auth.users.id.
-- The on_auth_user_created trigger creates the matching profile rows.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '11000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
    'menu-owner-test@example.com', '', now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Menu owner"}', now(), now()
  ),
  (
    '11000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
    'menu-manager-test@example.com', '', now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Menu manager"}', now(), now()
  ),
  (
    '11000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
    'menu-viewer-test@example.com', '', now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Menu viewer"}', now(), now()
  );

insert into public.businesses (id, owner_id, name, slug, is_published) values
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Draft menu business', 'draft-menu-test', false),
  ('21000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'Published menu business', 'published-menu-test', true);

-- Migration 011 seeds new businesses. Remove those rows so this older policy
-- test can continue exercising its original purpose with explicit fixtures.
delete from public.menu_categories
where business_id in (
  '21000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000002'
);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', 'manager', 'active'),
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', 'viewer', 'active');

insert into public.menu_categories (id, business_id, name, sort_order) values
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'Draft coffee', 0),
  ('31000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000002', 'Published coffee', 0);
insert into public.menu_items (business_id, category_id, name, price) values
  ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001', 'Draft flat white', 3.50),
  ('21000000-0000-0000-0000-000000000002', '31000000-0000-0000-0000-000000000002', 'Published flat white', 3.50);

set local role anon;
select pg_temp.assert_true((select count(*) = 1 from public.menu_categories), 'anonymous users should only read published categories');
select pg_temp.assert_true((select count(*) = 1 from public.menu_items), 'anonymous users should only read published menu items');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select pg_temp.assert_true((select count(*) = 2 from public.menu_categories), 'manager should read own draft and public categories');
insert into public.menu_categories (id, business_id, name, sort_order)
values ('32000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'Tea', 1);
insert into public.menu_items (id, business_id, category_id, name, price)
values ('42000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', 'Cortado', 3.25);

select public.delete_menu_category(
  '21000000-0000-0000-0000-000000000001',
  '32000000-0000-0000-0000-000000000001'
);
select pg_temp.assert_true(
  (select category_id is null from public.menu_items where id = '42000000-0000-0000-0000-000000000001'),
  'deleting a category should preserve its items as uncategorized'
);

do $$
begin
  begin
    insert into public.menu_items (business_id, category_id, name, price)
    values ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000002', 'Cross-business item', 1);
    raise exception 'cross-business category unexpectedly accepted';
  exception when others then
    if sqlerrm = 'cross-business category unexpectedly accepted' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.delete_menu_category(
      '21000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000001'
    );
    raise exception 'viewer unexpectedly deleted a category';
  exception when others then
    if sqlerrm = 'viewer unexpectedly deleted a category' then raise; end if;
  end;
end;
$$;
do $$
begin
  begin
    insert into public.menu_categories (business_id, name)
    values ('21000000-0000-0000-0000-000000000001', 'Forbidden');
    raise exception 'viewer unexpectedly created a category';
  exception when others then
    if sqlerrm = 'viewer unexpectedly created a category' then raise; end if;
  end;
end;
$$;

rollback;
