-- Transactional brand-palette constraints, profile permissions, and public exposure.
-- Run after Drizzle 0010 and Supabase 017. All fixtures are rolled back.

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

create or replace function pg_temp.update_brand(target uuid, primary_colour text) returns integer
language plpgsql as $$
declare affected integer;
begin
  update public.businesses set brand_primary_color = primary_colour where id = target;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select ('17000000-0000-0000-0000-' || lpad(number::text, 12, '0'))::uuid,
  'authenticated', 'authenticated', 'brand-' || number || '@example.com', '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', 'Brand role ' || number), now(), now()
from generate_series(1, 8) number;

insert into public.businesses (id, owner_id, name, slug, status, is_published) values
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', 'Brand business', 'brand-business', 'active', true),
  ('27000000-0000-0000-0000-000000000002', '17000000-0000-0000-0000-000000000008', 'Other business', 'brand-business-other', 'active', false);

insert into public.business_memberships (business_id, profile_id, role, status) values
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000002', 'admin', 'active'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000003', 'manager', 'active'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000004', 'finance', 'active'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000005', 'barista', 'active'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000006', 'viewer', 'active'),
  ('27000000-0000-0000-0000-000000000001', '17000000-0000-0000-0000-000000000007', 'manager', 'suspended'),
  ('27000000-0000-0000-0000-000000000002', '17000000-0000-0000-0000-000000000008', 'owner', 'active');

insert into public.posts (id, business_id, kind, title, body_text, published_at)
values ('37000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000001', 'news', 'Brand story', 'Story body', now());

select pg_temp.assert_true(
  (select brand_primary_color='#235C4B' and brand_accent_color='#D06E38' and brand_background_color='#F7F2EA'
   from public.businesses where id='27000000-0000-0000-0000-000000000001'),
  'new businesses receive the Local Mug palette'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
update public.businesses set brand_primary_color='#2F5D8A' where id='27000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
update public.businesses set brand_accent_color='#704C8A' where id='27000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
update public.businesses set brand_background_color='#FFFDF8' where id='27000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select pg_temp.assert_true(pg_temp.update_brand('27000000-0000-0000-0000-000000000001', '#235C4B')=0, 'finance cannot edit branding');
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
select pg_temp.assert_true(pg_temp.update_brand('27000000-0000-0000-0000-000000000001', '#235C4B')=0, 'barista cannot edit branding');
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000006","role":"authenticated"}', true);
select pg_temp.assert_true(pg_temp.update_brand('27000000-0000-0000-0000-000000000001', '#235C4B')=0, 'viewer cannot edit branding');
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000007","role":"authenticated"}', true);
select pg_temp.assert_true(pg_temp.update_brand('27000000-0000-0000-0000-000000000001', '#235C4B')=0, 'suspended manager cannot edit branding');
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000008","role":"authenticated"}', true);
select pg_temp.assert_true(pg_temp.update_brand('27000000-0000-0000-0000-000000000001', '#235C4B')=0, 'cross-business owner cannot edit branding');

select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select pg_temp.assert_throws($$update public.businesses set brand_primary_color='#ffffff' where id='27000000-0000-0000-0000-000000000001'$$, 'businesses_brand_colors_check');
select pg_temp.assert_throws($$update public.businesses set brand_primary_color='#FFFFFF' where id='27000000-0000-0000-0000-000000000001'$$, 'businesses_brand_contrast_check');

reset role;
set local role anon;
select pg_temp.assert_true(
  exists(select 1 from public.get_public_business_catalog() where id='27000000-0000-0000-0000-000000000001' and brand_primary_color='#2F5D8A' and brand_accent_color='#704C8A' and brand_background_color='#FFFDF8'),
  'catalog exposes only the safe palette fields'
);
select pg_temp.assert_true(
  exists(select 1 from public.get_public_business_detail('27000000-0000-0000-0000-000000000001') where brand_primary_color='#2F5D8A'),
  'business detail exposes the palette'
);
select pg_temp.assert_true(
  exists(select 1 from public.get_public_content_feed(target_post_id => '37000000-0000-0000-0000-000000000001') where business_brand_accent_color='#704C8A'),
  'content responses expose the current business palette'
);
select pg_temp.assert_true(
  not exists(select 1 from public.get_public_business_catalog() where id='27000000-0000-0000-0000-000000000002'),
  'unpublished businesses remain private'
);

rollback;
