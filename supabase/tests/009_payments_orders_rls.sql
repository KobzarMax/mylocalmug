-- Transactional payment/order permission and invariant tests. Run after migration 009.
begin;
create or replace function pg_temp.assert_true(result boolean,message text) returns void language plpgsql as $$begin if not coalesce(result,false) then raise exception 'Assertion failed: %',message;end if;end$$;
create or replace function pg_temp.assert_throws(statement text,expected text) returns void language plpgsql as $$begin execute statement;raise exception 'Expected failure';exception when others then if sqlerrm='Expected failure' then raise;end if;if position(lower(expected) in lower(sqlerrm))=0 then raise exception 'Expected %, got %',expected,sqlerrm;end if;end$$;
insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('15000000-0000-0000-0000-000000000001','authenticated','authenticated','pay-owner@example.com','',now(),'{}','{"display_name":"Owner"}',now(),now()),
('15000000-0000-0000-0000-000000000002','authenticated','authenticated','pay-finance@example.com','',now(),'{}','{"display_name":"Finance"}',now(),now()),
('15000000-0000-0000-0000-000000000003','authenticated','authenticated','pay-manager@example.com','',now(),'{}','{"display_name":"Manager"}',now(),now()),
('15000000-0000-0000-0000-000000000004','authenticated','authenticated','pay-barista@example.com','',now(),'{}','{"display_name":"Barista"}',now(),now()),
('15000000-0000-0000-0000-000000000005','authenticated','authenticated','pay-viewer@example.com','',now(),'{}','{"display_name":"Viewer"}',now(),now()),
('15000000-0000-0000-0000-000000000006','authenticated','authenticated','pay-customer@example.com','',now(),'{}','{"display_name":"Customer"}',now(),now());
update public.profiles set role='client' where id='15000000-0000-0000-0000-000000000006';
insert into public.businesses(id,owner_id,name,slug,status,is_published) values('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','Pay Coffee','pay-coffee','active',true);
insert into public.business_memberships(business_id,profile_id,role,status) values
('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','owner','active'),
('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000002','finance','active'),
('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000003','manager','active'),
('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000004','barista','active'),
('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000005','viewer','active');
-- Direct business inserts intentionally do not create operational locations. The
-- production application-approval workflow does, so this isolated fixture must
-- seed the same primary-location invariant explicitly.
insert into public.business_locations(id,business_id,name,address,timezone,is_primary)
values('55000000-0000-0000-0000-000000000001','25000000-0000-0000-0000-000000000001','Main location','1 Test Street, London','Europe/London',true);
insert into public.business_hours(location_id,day_of_week,opens_at,closes_at,is_closed)
select '55000000-0000-0000-0000-000000000001',day_number,'00:00','23:59',false
from generate_series(0,6) as day_number;
insert into public.menu_categories(id,business_id,name) values('35000000-0000-0000-0000-000000000001','25000000-0000-0000-0000-000000000001','Coffee');
insert into public.menu_items(id,business_id,category_id,name,price,is_available) values('45000000-0000-0000-0000-000000000001','25000000-0000-0000-0000-000000000001','35000000-0000-0000-0000-000000000001','Latte',3.50,true);
set local role authenticated;select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000006","role":"authenticated"}',true);
select public.create_trusted_order('25000000-0000-0000-0000-000000000001','customer','[{"menuItemId":"45000000-0000-0000-0000-000000000001","quantity":2}]','customer-key-001');
select pg_temp.assert_true((select total_pence=700 and customer_id=auth.uid() from public.orders where idempotency_key='customer-key-001'),'server calculates price and owner');
select pg_temp.assert_throws($q$select public.create_trusted_order('25000000-0000-0000-0000-000000000001','customer','[{"menuItemId":"45000000-0000-0000-0000-000000000001","quantity":100}]','customer-key-002')$q$,'quantity');
select pg_temp.assert_true((select count(*)=1 from public.orders),'customer sees own order');
select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select pg_temp.assert_true((select count(*)=0 from public.orders),'viewer cannot read orders');
select pg_temp.assert_throws($q$select public.create_trusted_order('25000000-0000-0000-0000-000000000001','till','[{"menuItemId":"45000000-0000-0000-0000-000000000001","quantity":1}]','viewer-key-001')$q$,'till access');
select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
select public.create_trusted_order('25000000-0000-0000-0000-000000000001','till','[{"menuItemId":"45000000-0000-0000-0000-000000000001","quantity":1}]','barista-key-001');
select pg_temp.assert_true((select count(*)=2 from public.orders),'barista can create and read till orders');
select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select pg_temp.assert_throws($q$select public.create_trusted_order('25000000-0000-0000-0000-000000000001','till','[{"menuItemId":"45000000-0000-0000-0000-000000000001","quantity":1}]','finance-key-001')$q$,'till access');
select pg_temp.assert_true(not public.business_role_has_permission('finance','payments.connect'),'finance cannot connect providers');
select pg_temp.assert_true(public.business_role_has_permission('manager','orders.manage') and public.business_role_has_permission('barista','orders.manage'),'staff manage orders');
reset role;rollback;
