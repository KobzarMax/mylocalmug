-- Transactional checks for supabase/migrations/011_default_menu_categories.sql.
-- Run in Supabase SQL Editor after migration 011. Every fixture is rolled back.

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
    if position(expected_message in sqlerrm) = 0 then
      raise exception 'Expected error containing "%", received "%"', expected_message, sqlerrm;
    end if;
  end;
end;
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '11000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated',
    'default-menu-owner@example.com', '', now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Menu owner"}', now(), now()
  ),
  (
    '11000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated',
    'default-menu-viewer@example.com', '', now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Menu viewer"}', now(), now()
  );

insert into public.businesses (id, owner_id, name, slug, is_published)
values (
  '21000000-0000-0000-0000-000000000011',
  '11000000-0000-0000-0000-000000000011',
  'Starter menu business',
  'starter-menu-business',
  false
);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('21000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000011', 'owner', 'active'),
  ('21000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000012', 'viewer', 'active');

select pg_temp.assert_true(
  (select count(*) = 5 from public.menu_categories where business_id = '21000000-0000-0000-0000-000000000011'),
  'new businesses receive five starter categories'
);
select pg_temp.assert_true(
  (select array_agg(name order by sort_order) = array['Coffee', 'Tea & hot drinks', 'Cold drinks', 'Food', 'Cakes & treats']
   from public.menu_categories where business_id = '21000000-0000-0000-0000-000000000011'),
  'starter categories have the expected names and order'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

update public.menu_categories
set name = 'Espresso bar'
where business_id = '21000000-0000-0000-0000-000000000011' and name = 'Coffee';
select pg_temp.assert_true(
  (select count(*) = 1 from public.menu_categories
   where business_id = '21000000-0000-0000-0000-000000000011' and name = 'Espresso bar'),
  'starter categories remain editable through normal menu policies'
);
select pg_temp.assert_true(
  public.add_default_menu_categories('21000000-0000-0000-0000-000000000011') = 0,
  'the starter action is idempotent for a non-empty menu'
);

delete from public.menu_categories where business_id = '21000000-0000-0000-0000-000000000011';
select pg_temp.assert_true(
  public.add_default_menu_categories('21000000-0000-0000-0000-000000000011') = 5,
  'an authorised owner can restore starter categories to an empty menu'
);

select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select pg_temp.assert_throws(
  $$select public.add_default_menu_categories('21000000-0000-0000-0000-000000000011')$$,
  'permission'
);

rollback;
