-- Transactional loyalty permissions, lifecycle, replay, earning, redemption, and reversal tests.
begin;
create or replace function pg_temp.assert_true(result boolean,message text) returns void language plpgsql as $$begin if not coalesce(result,false) then raise exception 'Assertion failed: %',message;end if;end$$;
create or replace function pg_temp.assert_throws(statement text,expected text) returns void language plpgsql as $$begin execute statement;raise exception 'Expected failure';exception when others then if sqlerrm='Expected failure' then raise;end if;if position(lower(expected) in lower(sqlerrm))=0 then raise exception 'Expected %, got %',expected,sqlerrm;end if;end$$;

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('16000000-0000-0000-0000-000000000001','authenticated','authenticated','reward-owner@example.com','',now(),'{}','{"display_name":"Owner"}',now(),now()),
('16000000-0000-0000-0000-000000000002','authenticated','authenticated','reward-manager@example.com','',now(),'{}','{"display_name":"Manager"}',now(),now()),
('16000000-0000-0000-0000-000000000003','authenticated','authenticated','reward-barista@example.com','',now(),'{}','{"display_name":"Barista"}',now(),now()),
('16000000-0000-0000-0000-000000000004','authenticated','authenticated','reward-viewer@example.com','',now(),'{}','{"display_name":"Viewer"}',now(),now()),
('16000000-0000-0000-0000-000000000005','authenticated','authenticated','reward-customer@example.com','',now(),'{}','{"display_name":"Customer"}',now(),now()),
('16000000-0000-0000-0000-000000000006','authenticated','authenticated','reward-suspended@example.com','',now(),'{}','{"display_name":"Suspended"}',now(),now());
update public.profiles set role='client' where id='16000000-0000-0000-0000-000000000005';
insert into public.businesses(id,owner_id,name,slug,status,is_published) values('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','Reward Coffee','reward-coffee','active',true);
insert into public.business_memberships(business_id,profile_id,role,status) values
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','owner','active'),
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000002','manager','active'),
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000003','barista','active'),
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000004','viewer','active'),
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000006','manager','suspended');
insert into public.menu_categories(id,business_id,name) values('36000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','Coffee');
insert into public.menu_items(id,business_id,category_id,name,price,is_available) values('46000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','Latte',3.50,true);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
create temp table created_program as select (public.save_loyalty_program('26000000-0000-0000-0000-000000000001',null,'{"type":"stamp","name":"Coffee stamps","description":"A stamp for every eligible coffee.","unitSingular":"stamp","unitPlural":"stamps","earningMethod":"item","pointsPerPound":null,"terms":"Buy an eligible coffee to earn one stamp. Staff verification is required.","effectiveAt":"2026-01-01T00:00:00Z","startsAt":null,"endsAt":null,"eligibility":[{"menuItemId":"46000000-0000-0000-0000-000000000001","unitsPerItem":1}],"tiers":[{"name":"Regular","threshold":1,"sortOrder":0}]}'::jsonb)).id program_id;
select public.set_loyalty_program_status((select program_id from created_program),'active');
select public.save_loyalty_offer('26000000-0000-0000-0000-000000000001',null,jsonb_build_object('programId',(select program_id from created_program),'tierId',null,'kind','balance_reward','benefitType','free_item','audience','members','title','Free coffee','description','Exchange one stamp for a coffee.','staffInstructions','Confirm the eligible coffee and apply it on the till.','balanceCost',1,'amountPence',null,'percentageOff',null,'usageLimit',null,'usagePeriod',null,'startsAt',null,'endsAt',null,'isActive',true,'items','[]'::jsonb,'mealDealGroups','[]'::jsonb));
select pg_temp.assert_true(public.business_role_has_permission('manager','loyalty.issue') and public.business_role_has_permission('manager','loyalty.reverse'),'manager receives aligned loyalty permissions');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000004","role":"authenticated"}',true);
select pg_temp.assert_throws($q$select public.save_loyalty_program('26000000-0000-0000-0000-000000000001',null,'{}')$q$,'access');
select pg_temp.assert_throws($q$update public.loyalty_accounts set balance=999$q$,'permission denied');
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000006","role":"authenticated"}',true);
select pg_temp.assert_throws($q$select public.save_loyalty_program('26000000-0000-0000-0000-000000000001',null,'{}')$q$,'access');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select public.join_loyalty_program((select program_id from created_program));
create temp table earn_code as select * from public.create_loyalty_challenge('26000000-0000-0000-0000-000000000001','earn',null);
select pg_temp.assert_throws($q$update public.loyalty_accounts set balance=999 where customer_id=auth.uid()$q$,'permission denied');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
create temp table claimed_earn as select * from public.claim_loyalty_challenge((select challenge_token from earn_code));
create temp table earned as select public.confirm_loyalty_earning((select challenge_id from claimed_earn),'[{"menuItemId":"46000000-0000-0000-0000-000000000001","quantity":1,"wasFree":false}]',350,'earn-test-0001') receipt;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select pg_temp.assert_true((select balance=1 and lifetime_earned=1 from public.loyalty_accounts where customer_id='16000000-0000-0000-0000-000000000005'),'trusted earning updates balance and lifetime progress');
select pg_temp.assert_true((select count(*)=1 from public.loyalty_tier_unlocks),'earning unlocks the programme tier');
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select pg_temp.assert_true((select error_message ilike '%already used%' from public.claim_loyalty_challenge((select challenge_token from earn_code))),'replayed code is rejected and recorded');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
create temp table redeem_code as select * from public.create_loyalty_challenge('26000000-0000-0000-0000-000000000001','redeem',(select id from public.loyalty_offers where title='Free coffee'));
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
create temp table claimed_redeem as select * from public.claim_loyalty_challenge((select challenge_token from redeem_code));
select public.consume_loyalty_redemption((select challenge_id from claimed_redeem),'[{"menuItemId":"46000000-0000-0000-0000-000000000001","quantity":1,"wasFree":false}]','redeem-test-0001');
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select pg_temp.assert_true((select balance=0 and lifetime_earned=1 from public.loyalty_accounts where customer_id='16000000-0000-0000-0000-000000000005'),'redemption spends balance but retains lifetime progress');
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
select pg_temp.assert_throws(format('select public.reverse_loyalty_purchase(%L,%L,%L)',(select receipt->>'purchaseId' from earned),'Already consumed','reverse-test-0001'),'already been used');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
create temp table earn_code_two as select * from public.create_loyalty_challenge('26000000-0000-0000-0000-000000000001','earn',null);
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
create temp table claimed_two as select * from public.claim_loyalty_challenge((select challenge_token from earn_code_two));
create temp table earned_two as select public.confirm_loyalty_earning((select challenge_id from claimed_two),'[{"menuItemId":"46000000-0000-0000-0000-000000000001","quantity":1,"wasFree":false}]',350,'earn-test-0002') receipt;
select public.reverse_loyalty_purchase((select (receipt->>'purchaseId')::uuid from earned_two),'Barista corrected duplicate issue','reverse-test-0002');
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated"}',true);
select pg_temp.assert_true((select balance=0 and lifetime_earned=1 from public.loyalty_accounts where customer_id='16000000-0000-0000-0000-000000000005'),'timed issuer reversal creates compensating entries');

set local role anon;select set_config('request.jwt.claims','{"role":"anon"}',true);
select pg_temp.assert_true((select count(*)=1 from public.loyalty_programs where business_id='26000000-0000-0000-0000-000000000001'),'anonymous users can read published active programmes');
reset role;
rollback;
