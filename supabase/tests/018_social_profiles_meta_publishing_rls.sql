-- Transactional social permissions, queue lifecycle, replay, and credential isolation tests.
-- Run after Drizzle 0011/0012 and Supabase 018. Fixtures are rolled back.
begin;

create or replace function pg_temp.assert_true(result boolean,message text) returns void language plpgsql as $$begin if not coalesce(result,false) then raise exception 'Assertion failed: %',message; end if; end$$;
create or replace function pg_temp.assert_throws(statement text,expected text) returns void language plpgsql as $$begin begin execute statement; raise exception 'Expected statement to fail: %',statement; exception when others then if sqlerrm like 'Expected statement to fail:%' then raise; end if; if position(lower(expected) in lower(sqlerrm))=0 then raise exception 'Expected error containing "%", received "%"',expected,sqlerrm; end if; end; end$$;

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select ('18000000-0000-0000-0000-'||lpad(number::text,12,'0'))::uuid,'authenticated','authenticated','social-'||number||'@example.com','',now(),'{}','{}',now(),now() from generate_series(1,8) number;
insert into public.businesses(id,owner_id,name,slug,status,is_published) values
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001','Social A','social-a','active',true),
('28000000-0000-0000-0000-000000000002','18000000-0000-0000-0000-000000000008','Social B','social-b','active',true);
insert into public.business_memberships(business_id,profile_id,role,status) values
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000001','owner','active'),
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000002','admin','active'),
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000003','manager','active'),
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000004','finance','active'),
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000005','barista','active'),
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000006','viewer','active'),
('28000000-0000-0000-0000-000000000001','18000000-0000-0000-0000-000000000007','manager','suspended'),
('28000000-0000-0000-0000-000000000002','18000000-0000-0000-0000-000000000008','owner','active');
insert into public.posts(id,business_id,kind,title,excerpt,body_text,published_at,updated_at) values
('38000000-0000-0000-0000-000000000001','28000000-0000-0000-0000-000000000001','news','Social story','Story excerpt','Story body',date_trunc('second',now())+interval '1 hour',date_trunc('second',now()));
insert into public.social_connections(id,business_id,provider,external_account_id,account_name,profile_url,status,created_by) values
('48000000-0000-0000-0000-000000000001','28000000-0000-0000-0000-000000000001','facebook','page-1','Social Page','https://www.facebook.com/page-1','ready','18000000-0000-0000-0000-000000000001'),
('48000000-0000-0000-0000-000000000002','28000000-0000-0000-0000-000000000001','instagram','ig-1','Social Instagram','https://www.instagram.com/social','ready','18000000-0000-0000-0000-000000000001');
insert into public.social_connection_credentials(connection_id,token_ciphertext,token_nonce) values
('48000000-0000-0000-0000-000000000001','secret-ciphertext','secret-nonce'),
('48000000-0000-0000-0000-000000000002','secret-ciphertext','secret-nonce');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select pg_temp.assert_true(public.has_business_permission('28000000-0000-0000-0000-000000000001','social.connect'),'owner connects social accounts');
select pg_temp.assert_true((select count(*)=2 from public.get_business_social_connections('28000000-0000-0000-0000-000000000001')),'owner reads safe connection state');
select pg_temp.assert_throws($$select * from public.social_connection_credentials$$,'permission denied');
select pg_temp.assert_throws($$insert into public.social_connections(business_id,provider,external_account_id,account_name,profile_url) values('28000000-0000-0000-0000-000000000001','facebook','forged','Forged','https://facebook.com/forged')$$,'permission denied');

select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
select pg_temp.assert_true(public.has_business_permission('28000000-0000-0000-0000-000000000001','social.connect'),'admin connects social accounts');
select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select pg_temp.assert_true(not public.has_business_permission('28000000-0000-0000-0000-000000000001','social.connect'),'manager cannot connect social accounts');
select public.queue_social_publications('28000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001','initial',(select published_at from public.posts where id='38000000-0000-0000-0000-000000000001'),'https://localmug.example/content/38000000-0000-0000-0000-000000000001','{"facebook":"A reviewed Facebook caption"}'::jsonb,null);
select pg_temp.assert_true((select count(*)=1 from public.get_post_social_publications('38000000-0000-0000-0000-000000000001')),'manager queues and reads reviewed publications');
select pg_temp.assert_throws($$select public.queue_social_publications('28000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001','initial',(select published_at from public.posts where id='38000000-0000-0000-0000-000000000001'),'https://localmug.example/content/38000000-0000-0000-0000-000000000001','{"facebook":"Replay"}'::jsonb,null)$$,'already exists');

select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
select pg_temp.assert_throws($$select * from public.get_business_social_connections('28000000-0000-0000-0000-000000000001')$$,'access required');
select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select pg_temp.assert_throws($$select * from public.get_business_social_connections('28000000-0000-0000-0000-000000000001')$$,'access required');
select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000006","role":"authenticated"}',true);
select pg_temp.assert_throws($$select * from public.get_business_social_connections('28000000-0000-0000-0000-000000000001')$$,'access required');
select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000007","role":"authenticated"}',true);
select pg_temp.assert_throws($$select * from public.get_business_social_connections('28000000-0000-0000-0000-000000000001')$$,'access required');
select set_config('request.jwt.claims','{"sub":"18000000-0000-0000-0000-000000000008","role":"authenticated"}',true);
select pg_temp.assert_throws($$select * from public.get_business_social_connections('28000000-0000-0000-0000-000000000001')$$,'access required');

reset role;
update public.social_publications set status='failed',due_at=now()-interval '1 minute',next_attempt_at=null
where post_id='38000000-0000-0000-0000-000000000001';
set local role service_role;
select pg_temp.assert_true(not exists(select 1 from public.claim_social_publications(20)),'terminal failures are not claimed automatically');
reset role;
update public.social_publications set next_attempt_at=now()-interval '1 minute'
where post_id='38000000-0000-0000-0000-000000000001';
set local role service_role;
select pg_temp.assert_true((select count(*)=1 from public.claim_social_publications(20)),'scheduled failures are claimed when their retry is due');
reset role;
set local role anon;
select pg_temp.assert_throws($$select * from public.get_business_social_connections('28000000-0000-0000-0000-000000000001')$$,'permission denied');
select pg_temp.assert_throws($$select * from public.social_publications$$,'permission denied');
rollback;
