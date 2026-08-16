-- Configurable loyalty, promotions, fraud-resistant QR workflows, and event menu links.
-- Apply after drizzle/0007_configurable_loyalty.sql and supabase/migrations/009_payments_orders.sql.

create or replace function public.business_role_has_permission(member_role public.business_member_role, permission_key text)
returns boolean language sql immutable set search_path = public as $$
  select case
    when member_role = 'owner' then true
    when member_role = 'admin' then permission_key <> 'ownership.transfer'
    when member_role = 'manager' then permission_key = any(array[
      'business.profile.read','business.profile.write','menu.manage','content.manage','rewards.manage',
      'team.read','analytics.read','payments.charge','orders.read','orders.manage','loyalty.issue','loyalty.reverse'
    ])
    when member_role = 'finance' then permission_key = any(array[
      'business.profile.read','payments.read','payments.refund','analytics.read','legal.read','legal.write'
    ])
    when member_role = 'barista' then permission_key = any(array[
      'business.profile.read','payments.charge','orders.read','orders.manage','loyalty.issue'
    ])
    when member_role = 'viewer' then permission_key = any(array['business.profile.read','analytics.read'])
    else false end;
$$;

alter table public.loyalty_programs enable row level security;
alter table public.loyalty_program_versions enable row level security;
alter table public.loyalty_program_eligibility enable row level security;
alter table public.loyalty_tiers enable row level security;
alter table public.loyalty_offers enable row level security;
alter table public.loyalty_offer_items enable row level security;
alter table public.loyalty_meal_deal_groups enable row level security;
alter table public.loyalty_meal_deal_group_items enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_tier_unlocks enable row level security;
alter table public.loyalty_purchase_events enable row level security;
alter table public.loyalty_purchase_items enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.loyalty_redemptions enable row level security;
alter table public.loyalty_qr_challenges enable row level security;
alter table public.loyalty_fraud_events enable row level security;
alter table public.event_menu_items enable row level security;

revoke all on public.loyalty_programs, public.loyalty_program_versions, public.loyalty_program_eligibility,
  public.loyalty_tiers, public.loyalty_offers, public.loyalty_offer_items, public.loyalty_meal_deal_groups,
  public.loyalty_meal_deal_group_items, public.loyalty_accounts, public.loyalty_tier_unlocks,
  public.loyalty_purchase_events, public.loyalty_purchase_items, public.loyalty_ledger,
  public.loyalty_redemptions, public.loyalty_qr_challenges, public.loyalty_fraud_events,
  public.event_menu_items from anon, authenticated;

grant select on public.loyalty_programs, public.loyalty_program_versions, public.loyalty_program_eligibility,
  public.loyalty_tiers, public.loyalty_offers, public.loyalty_offer_items, public.loyalty_meal_deal_groups,
  public.loyalty_meal_deal_group_items, public.loyalty_accounts, public.loyalty_tier_unlocks,
  public.loyalty_purchase_events, public.loyalty_purchase_items, public.loyalty_ledger,
  public.loyalty_redemptions, public.event_menu_items to authenticated;
grant select on public.loyalty_programs, public.loyalty_program_versions, public.loyalty_program_eligibility,
  public.loyalty_tiers, public.loyalty_offers, public.loyalty_offer_items,
  public.loyalty_meal_deal_groups, public.loyalty_meal_deal_group_items,
  public.event_menu_items to anon;

create policy "public read available loyalty programmes" on public.loyalty_programs for select to anon, authenticated
using (((status in ('active','paused','ended') or (status='scheduled' and starts_at<=now())) and (ends_at is null or ends_at>now() or status in ('paused','ended')) and archived_at is null and exists (
  select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published
)) or public.has_business_permission(business_id,'rewards.manage'));
create policy "public read loyalty versions" on public.loyalty_program_versions for select to anon, authenticated
using (exists(select 1 from public.loyalty_programs p where p.id=program_id));
create policy "public read loyalty eligibility" on public.loyalty_program_eligibility for select to anon, authenticated
using (exists(select 1 from public.loyalty_program_versions v join public.loyalty_programs p on p.id=v.program_id where v.id=version_id));
create policy "public read loyalty tiers" on public.loyalty_tiers for select to anon, authenticated
using (exists(select 1 from public.loyalty_program_versions v join public.loyalty_programs p on p.id=v.program_id where v.id=version_id));
create policy "public read available loyalty offers" on public.loyalty_offers for select to anon, authenticated
using ((is_active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()) and exists(
  select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published
)) or public.has_business_permission(business_id,'rewards.manage'));
create policy "public read loyalty offer items" on public.loyalty_offer_items for select to anon, authenticated
using (exists(select 1 from public.loyalty_offers o where o.id=offer_id));
create policy "public read meal deal groups" on public.loyalty_meal_deal_groups for select to anon, authenticated
using (exists(select 1 from public.loyalty_offers o where o.id=offer_id));
create policy "public read meal deal items" on public.loyalty_meal_deal_group_items for select to anon, authenticated
using (exists(select 1 from public.loyalty_meal_deal_groups g join public.loyalty_offers o on o.id=g.offer_id where g.id=group_id));
create policy "customers and managers read loyalty accounts" on public.loyalty_accounts for select to authenticated
using (customer_id=auth.uid() or exists(select 1 from public.loyalty_programs p where p.id=program_id and public.has_business_permission(p.business_id,'rewards.manage')));
create policy "customers and managers read tier unlocks" on public.loyalty_tier_unlocks for select to authenticated
using (exists(select 1 from public.loyalty_accounts a join public.loyalty_programs p on p.id=a.program_id where a.id=account_id and (a.customer_id=auth.uid() or public.has_business_permission(p.business_id,'rewards.manage'))));
create policy "participants read loyalty purchases" on public.loyalty_purchase_events for select to authenticated
using (customer_id=auth.uid() or public.has_business_permission(business_id,'rewards.manage') or public.has_business_permission(business_id,'loyalty.issue'));
create policy "participants read loyalty purchase items" on public.loyalty_purchase_items for select to authenticated
using (exists(select 1 from public.loyalty_purchase_events e where e.id=purchase_id and (e.customer_id=auth.uid() or public.has_business_permission(e.business_id,'rewards.manage') or public.has_business_permission(e.business_id,'loyalty.issue'))));
create policy "participants read loyalty ledger" on public.loyalty_ledger for select to authenticated
using (exists(select 1 from public.loyalty_accounts a join public.loyalty_programs p on p.id=a.program_id where a.id=account_id and (a.customer_id=auth.uid() or public.has_business_permission(p.business_id,'rewards.manage'))));
create policy "participants read loyalty redemptions" on public.loyalty_redemptions for select to authenticated
using (customer_id=auth.uid() or exists(select 1 from public.loyalty_offers o where o.id=offer_id and (public.has_business_permission(o.business_id,'rewards.manage') or public.has_business_permission(o.business_id,'loyalty.issue'))));
create policy "public read current event menu links" on public.event_menu_items for select to anon, authenticated
using (exists(select 1 from public.posts p join public.businesses b on b.id=p.business_id where p.id=event_id and p.kind='event' and p.published_at<=now() and p.archived_at is null and p.event_cancelled_at is null and b.status='active' and b.is_published)
  or exists(select 1 from public.posts p where p.id=event_id and public.has_business_permission(p.business_id,'content.manage')));

-- Backfill the original stamp-card prototype without losing balances or immutable history.
insert into public.loyalty_programs(id,business_id,type,name,description,unit_singular,unit_plural,status,current_version,starts_at,ends_at,created_by,created_at,updated_at)
select r.id,r.business_id,'stamp',r.title,r.description,'stamp','stamps',
  (case when r.is_active then 'active' else 'paused' end)::public.loyalty_program_status,
  1,r.starts_at,r.ends_at,b.owner_id,r.created_at,r.created_at
from public.rewards r join public.businesses b on b.id=r.business_id where r.type='stamp_card'
on conflict(id) do nothing;
insert into public.loyalty_program_versions(program_id,version,earning_method,terms,effective_at,created_by,created_at)
select p.id,1,'item',coalesce(nullif(p.description,''),'Earn stamps on eligible purchases.'),p.created_at,p.created_by,p.created_at
from public.loyalty_programs p where not exists(select 1 from public.loyalty_program_versions v where v.program_id=p.id);
insert into public.loyalty_program_eligibility(version_id,menu_item_id,units_per_item)
select v.id,ri.menu_item_id,greatest(1,ri.quantity) from public.reward_items ri join public.loyalty_program_versions v on v.program_id=ri.reward_id and v.version=1
on conflict do nothing;
insert into public.loyalty_accounts(id,program_id,customer_id,balance,lifetime_earned,joined_version,joined_at,updated_at)
select w.id,w.reward_id,w.client_id,w.stamp_count,greatest(w.stamp_count,coalesce((select sum(greatest(t.amount,0))::integer from public.stamp_transactions t where t.wallet_id=w.id),0)),1,w.updated_at,w.updated_at
from public.loyalty_wallets w join public.loyalty_programs p on p.id=w.reward_id on conflict(id) do nothing;
insert into public.loyalty_ledger(id,account_id,kind,amount,lifetime_amount,actor_id,idempotency_key,note,created_at)
select t.id,t.wallet_id,case when t.amount>0 then 'migration'::public.loyalty_ledger_kind else 'reversal'::public.loyalty_ledger_kind end,t.amount,greatest(t.amount,0),t.issued_by,'legacy:'||t.id,coalesce(t.note,'Migrated stamp transaction'),t.created_at
from public.stamp_transactions t join public.loyalty_accounts a on a.id=t.wallet_id on conflict(id) do nothing;
insert into public.loyalty_offers(id,business_id,kind,benefit_type,audience,title,description,staff_instructions,is_active,starts_at,ends_at,created_at,updated_at)
select r.id,r.business_id,'promotion','custom_perk','everyone',r.title,r.description,'Validate the original promotion terms with the customer.',r.is_active,r.starts_at,r.ends_at,r.created_at,r.created_at
from public.rewards r where r.type in ('bonus','combo') on conflict(id) do nothing;

create or replace function public.save_loyalty_program(target_business_id uuid,target_program_id uuid,input jsonb)
returns public.loyalty_programs language plpgsql security definer set search_path=public as $$
declare caller uuid:=auth.uid(); result public.loyalty_programs; next_version integer; version_id uuid; entry jsonb; requested_type public.loyalty_program_type; requested_method public.loyalty_earning_method;
begin
  if caller is null or not public.has_business_permission(target_business_id,'rewards.manage') then raise exception 'Rewards management access required'; end if;
  requested_type := (input->>'type')::public.loyalty_program_type; requested_method := (input->>'earningMethod')::public.loyalty_earning_method;
  if char_length(btrim(input->>'name')) not between 3 and 100 then raise exception 'Programme name must be 3 to 100 characters'; end if;
  if char_length(btrim(input->>'terms')) not between 10 and 4000 then raise exception 'Customer terms must be 10 to 4000 characters'; end if;
  if requested_type='stamp' and requested_method<>'item' then raise exception 'Stamp programmes must earn by item'; end if;
  if requested_method='spend' and coalesce((input->>'pointsPerPound')::integer,0) not between 1 and 10000 then raise exception 'Points per pound must be between 1 and 10000'; end if;
  if target_program_id is null then
    insert into public.loyalty_programs(business_id,type,name,description,unit_singular,unit_plural,status,starts_at,ends_at,created_by)
    values(target_business_id,requested_type,btrim(input->>'name'),left(coalesce(input->>'description',''),500),left(btrim(input->>'unitSingular'),30),left(btrim(input->>'unitPlural'),30),'draft',nullif(input->>'startsAt','')::timestamptz,nullif(input->>'endsAt','')::timestamptz,caller)
    returning * into result; next_version:=1;
  else
    select * into result from public.loyalty_programs where id=target_program_id and business_id=target_business_id for update;
    if result.id is null then raise exception 'Programme not found'; end if;
    if result.status='archived' then raise exception 'Archived programmes cannot be edited'; end if;
    next_version:=result.current_version+1;
    update public.loyalty_programs set type=requested_type,name=btrim(input->>'name'),description=left(coalesce(input->>'description',''),500),unit_singular=left(btrim(input->>'unitSingular'),30),unit_plural=left(btrim(input->>'unitPlural'),30),current_version=next_version,starts_at=nullif(input->>'startsAt','')::timestamptz,ends_at=nullif(input->>'endsAt','')::timestamptz,updated_at=now() where id=result.id returning * into result;
  end if;
  insert into public.loyalty_program_versions(program_id,version,earning_method,points_per_pound,terms,effective_at,created_by)
  values(result.id,next_version,requested_method,case when requested_method='spend' then (input->>'pointsPerPound')::integer end,btrim(input->>'terms'),coalesce(nullif(input->>'effectiveAt','')::timestamptz,now()),caller) returning id into version_id;
  for entry in select * from jsonb_array_elements(coalesce(input->'eligibility','[]'::jsonb)) loop
    if entry->>'menuItemId' is not null then
      if not exists(select 1 from public.menu_items where id=(entry->>'menuItemId')::uuid and business_id=target_business_id) then raise exception 'Invalid eligible menu item'; end if;
      insert into public.loyalty_program_eligibility(version_id,menu_item_id,units_per_item) values(version_id,(entry->>'menuItemId')::uuid,greatest(1,coalesce((entry->>'unitsPerItem')::integer,1)));
    elsif entry->>'categoryId' is not null then
      if not exists(select 1 from public.menu_categories where id=(entry->>'categoryId')::uuid and business_id=target_business_id) then raise exception 'Invalid eligible category'; end if;
      insert into public.loyalty_program_eligibility(version_id,category_id,units_per_item) values(version_id,(entry->>'categoryId')::uuid,greatest(1,coalesce((entry->>'unitsPerItem')::integer,1)));
    end if;
  end loop;
  for entry in select * from jsonb_array_elements(coalesce(input->'tiers','[]'::jsonb)) loop
    insert into public.loyalty_tiers(version_id,name,threshold,sort_order) values(version_id,left(btrim(entry->>'name'),60),(entry->>'threshold')::integer,coalesce((entry->>'sortOrder')::integer,0));
  end loop;
  return result;
end $$;

create or replace function public.confirm_loyalty_earning(target_challenge_id uuid,requested_items jsonb,final_eligible_pence integer,request_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare caller uuid:=auth.uid(); challenge public.loyalty_qr_challenges; purchase public.loyalty_purchase_events; item jsonb; menu public.menu_items; account public.loyalty_accounts; program public.loyalty_programs; version public.loyalty_program_versions; earned integer; results jsonb:='[]'::jsonb;
begin
  if caller is null or char_length(request_key) not between 8 and 120 then raise exception 'Invalid request'; end if;
  select * into challenge from public.loyalty_qr_challenges where id=target_challenge_id for update;
  if challenge.id is null or challenge.claimed_by<>caller then raise exception 'Earning code is invalid'; end if;
  select * into purchase from public.loyalty_purchase_events where verified_by=caller and idempotency_key=request_key;
  if purchase.id is not null then
    return (select jsonb_build_object('purchaseId',purchase.id,'entries',coalesce(jsonb_agg(jsonb_build_object('programId',p.id,'programName',p.name,'amount',l.amount)),'[]'::jsonb)) from public.loyalty_ledger l join public.loyalty_accounts a on a.id=l.account_id join public.loyalty_programs p on p.id=a.program_id where l.purchase_id=purchase.id);
  end if;
  if challenge.id is null or challenge.purpose<>'earn' or challenge.status<>'claimed' or challenge.claimed_by<>caller or challenge.expires_at<=now() then raise exception 'Earning code is invalid or expired'; end if;
  if not public.has_business_permission(challenge.business_id,'loyalty.issue') then raise exception 'Loyalty issuing access required'; end if;
  if final_eligible_pence<0 or final_eligible_pence>1000000 then raise exception 'Eligible spend is invalid'; end if;
  if jsonb_typeof(requested_items)<>'array' or jsonb_array_length(requested_items)>100 then raise exception 'Purchase items are invalid'; end if;
  insert into public.loyalty_purchase_events(business_id,customer_id,verified_by,final_eligible_pence,idempotency_key)
  values(challenge.business_id,challenge.customer_id,caller,final_eligible_pence,request_key) returning * into purchase;
  for item in select * from jsonb_array_elements(requested_items) loop
    if coalesce((item->>'quantity')::integer,0) not between 1 and 99 then raise exception 'Item quantity is invalid'; end if;
    select * into menu from public.menu_items where id=(item->>'menuItemId')::uuid and business_id=challenge.business_id and is_available;
    if menu.id is null then raise exception 'Menu item is unavailable'; end if;
    insert into public.loyalty_purchase_items(purchase_id,menu_item_id,item_name,quantity,was_free)
    values(purchase.id,menu.id,menu.name,(item->>'quantity')::integer,coalesce((item->>'wasFree')::boolean,false));
  end loop;
  for account in select a.* from public.loyalty_accounts a join public.loyalty_programs p on p.id=a.program_id where a.customer_id=challenge.customer_id and p.business_id=challenge.business_id and (p.status='active' or (p.status='scheduled' and p.starts_at<=now())) and (p.ends_at is null or p.ends_at>now()) for update of a loop
    select * into program from public.loyalty_programs where id=account.program_id;
    select * into version from public.loyalty_program_versions
    where program_id=program.id and effective_at<=now()
    order by effective_at desc,version desc limit 1;
    if version.id is null then continue; end if;
    if version.earning_method='spend' then earned:=floor(final_eligible_pence*version.points_per_pound/100.0)::integer;
    else
      select coalesce(sum(pi.quantity*(select max(e.units_per_item) from public.loyalty_program_eligibility e where e.version_id=version.id and (e.menu_item_id=pi.menu_item_id or e.category_id=mi.category_id))),0)::integer into earned
      from public.loyalty_purchase_items pi join public.menu_items mi on mi.id=pi.menu_item_id
      where pi.purchase_id=purchase.id and not pi.was_free and exists(select 1 from public.loyalty_program_eligibility e where e.version_id=version.id and (e.menu_item_id=pi.menu_item_id or e.category_id=mi.category_id));
    end if;
    if earned>0 then
      insert into public.loyalty_ledger(account_id,kind,amount,lifetime_amount,purchase_id,actor_id,idempotency_key,note)
      values(account.id,'earn',earned,earned,purchase.id,caller,request_key,'Staff-verified external till purchase');
      update public.loyalty_accounts set balance=balance+earned,lifetime_earned=lifetime_earned+earned,updated_at=now() where id=account.id returning * into account;
      insert into public.loyalty_tier_unlocks(account_id,tier_id)
      select account.id,t.id from public.loyalty_tiers t where t.version_id=version.id and t.threshold<=account.lifetime_earned on conflict do nothing;
      results:=results||jsonb_build_array(jsonb_build_object('programId',program.id,'programName',program.name,'amount',earned,'balance',account.balance,'lifetimeEarned',account.lifetime_earned));
    end if;
  end loop;
  update public.loyalty_qr_challenges set status='consumed',consumed_at=now() where id=challenge.id;
  return jsonb_build_object('purchaseId',purchase.id,'entries',results);
end $$;

create or replace function public.save_loyalty_offer(target_business_id uuid,target_offer_id uuid,input jsonb)
returns public.loyalty_offers language plpgsql security definer set search_path=public as $$
declare caller uuid:=auth.uid(); result public.loyalty_offers; entry jsonb; group_entry jsonb; created_group uuid; requested_kind public.loyalty_offer_kind; requested_benefit public.loyalty_benefit_type; requested_audience public.loyalty_offer_audience;
begin
  if caller is null or not public.has_business_permission(target_business_id,'rewards.manage') then raise exception 'Rewards management access required'; end if;
  requested_kind:=(input->>'kind')::public.loyalty_offer_kind; requested_benefit:=(input->>'benefitType')::public.loyalty_benefit_type; requested_audience:=coalesce((input->>'audience')::public.loyalty_offer_audience,'members');
  if char_length(btrim(input->>'title')) not between 3 and 100 then raise exception 'Offer title must be 3 to 100 characters'; end if;
  if requested_kind='balance_reward' and coalesce((input->>'balanceCost')::integer,0)<=0 then raise exception 'Balance cost required'; end if;
  if requested_audience='tier' and input->>'tierId' is null then raise exception 'Tier audience required'; end if;
  if input->>'programId' is not null and not exists(select 1 from public.loyalty_programs where id=(input->>'programId')::uuid and business_id=target_business_id) then raise exception 'Invalid programme'; end if;
  if input->>'tierId' is not null and not exists(select 1 from public.loyalty_tiers t join public.loyalty_program_versions v on v.id=t.version_id join public.loyalty_programs p on p.id=v.program_id where t.id=(input->>'tierId')::uuid and p.business_id=target_business_id) then raise exception 'Invalid tier'; end if;
  if target_offer_id is null then
    insert into public.loyalty_offers(business_id,program_id,tier_id,kind,benefit_type,audience,title,description,staff_instructions,balance_cost,amount_pence,percentage_off,usage_limit,usage_period,starts_at,ends_at,is_active)
    values(target_business_id,nullif(input->>'programId','')::uuid,nullif(input->>'tierId','')::uuid,requested_kind,requested_benefit,requested_audience,btrim(input->>'title'),left(coalesce(input->>'description',''),500),left(coalesce(input->>'staffInstructions',''),500),nullif(input->>'balanceCost','')::integer,nullif(input->>'amountPence','')::integer,nullif(input->>'percentageOff','')::integer,nullif(input->>'usageLimit','')::integer,nullif(input->>'usagePeriod','')::public.loyalty_usage_period,nullif(input->>'startsAt','')::timestamptz,nullif(input->>'endsAt','')::timestamptz,coalesce((input->>'isActive')::boolean,true)) returning * into result;
  else
    select * into result from public.loyalty_offers where id=target_offer_id and business_id=target_business_id for update;
    if result.id is null then raise exception 'Offer not found'; end if;
    update public.loyalty_offers set program_id=nullif(input->>'programId','')::uuid,tier_id=nullif(input->>'tierId','')::uuid,kind=requested_kind,benefit_type=requested_benefit,audience=requested_audience,title=btrim(input->>'title'),description=left(coalesce(input->>'description',''),500),staff_instructions=left(coalesce(input->>'staffInstructions',''),500),balance_cost=nullif(input->>'balanceCost','')::integer,amount_pence=nullif(input->>'amountPence','')::integer,percentage_off=nullif(input->>'percentageOff','')::integer,usage_limit=nullif(input->>'usageLimit','')::integer,usage_period=nullif(input->>'usagePeriod','')::public.loyalty_usage_period,starts_at=nullif(input->>'startsAt','')::timestamptz,ends_at=nullif(input->>'endsAt','')::timestamptz,is_active=coalesce((input->>'isActive')::boolean,true),updated_at=now() where id=result.id returning * into result;
    delete from public.loyalty_offer_items where offer_id=result.id; delete from public.loyalty_meal_deal_groups where offer_id=result.id;
  end if;
  for entry in select * from jsonb_array_elements(coalesce(input->'items','[]'::jsonb)) loop
    if not exists(select 1 from public.menu_items where id=(entry->>'menuItemId')::uuid and business_id=target_business_id) then raise exception 'Invalid offer item'; end if;
    insert into public.loyalty_offer_items(offer_id,menu_item_id,role,quantity) values(result.id,(entry->>'menuItemId')::uuid,coalesce(entry->>'role','eligible'),greatest(1,coalesce((entry->>'quantity')::integer,1)));
  end loop;
  for group_entry in select * from jsonb_array_elements(coalesce(input->'mealDealGroups','[]'::jsonb)) loop
    insert into public.loyalty_meal_deal_groups(offer_id,name,quantity,sort_order) values(result.id,left(group_entry->>'name',80),greatest(1,coalesce((group_entry->>'quantity')::integer,1)),coalesce((group_entry->>'sortOrder')::integer,0)) returning id into created_group;
    for entry in select * from jsonb_array_elements(coalesce(group_entry->'menuItemIds','[]'::jsonb)) loop
      if not exists(select 1 from public.menu_items where id=(entry#>>'{}')::uuid and business_id=target_business_id) then raise exception 'Invalid meal-deal item'; end if;
      insert into public.loyalty_meal_deal_group_items(group_id,menu_item_id) values(created_group,(entry#>>'{}')::uuid);
    end loop;
  end loop;
  return result;
end $$;

create or replace function public.consume_loyalty_redemption(target_challenge_id uuid,requested_items jsonb,request_key text)
returns public.loyalty_redemptions language plpgsql security definer set search_path=public as $$
declare caller uuid:=auth.uid(); challenge public.loyalty_qr_challenges; offer public.loyalty_offers; account public.loyalty_accounts; result public.loyalty_redemptions; group_record public.loyalty_meal_deal_groups; period_start timestamptz; item jsonb;
begin
  select * into challenge from public.loyalty_qr_challenges where id=target_challenge_id for update;
  select * into result from public.loyalty_redemptions where consumed_by=caller and idempotency_key=request_key;
  if result.id is not null then return result; end if;
  if challenge.id is null or challenge.purpose<>'redeem' or challenge.status<>'claimed' or challenge.claimed_by<>caller or challenge.expires_at<=now() then raise exception 'Redemption code is invalid or expired'; end if;
  if not public.has_business_permission(challenge.business_id,'loyalty.issue') then raise exception 'Loyalty issuing access required'; end if;
  select * into offer from public.loyalty_offers where id=challenge.offer_id and business_id=challenge.business_id and is_active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now());
  if offer.id is null then raise exception 'Offer unavailable'; end if;
  if offer.program_id is not null then select * into account from public.loyalty_accounts where program_id=offer.program_id and customer_id=challenge.customer_id for update; end if;
  if offer.audience='members' and account.id is null then raise exception 'Programme membership required'; end if;
  if offer.audience='tier' and not exists(select 1 from public.loyalty_tier_unlocks where account_id=account.id and tier_id=offer.tier_id) then raise exception 'Required tier not unlocked'; end if;
  if offer.kind='tier_perk' and not exists(select 1 from public.loyalty_tier_unlocks where account_id=account.id and tier_id=offer.tier_id) then raise exception 'Tier perk is locked'; end if;
  if offer.kind='balance_reward' and (account.id is null or account.balance<offer.balance_cost) then raise exception 'Insufficient balance'; end if;
  if offer.usage_limit is not null then
    period_start:=case offer.usage_period when 'day' then date_trunc('day',now()) when 'week' then date_trunc('week',now()) else date_trunc('month',now()) end;
    if (select count(*) from public.loyalty_redemptions where offer_id=offer.id and customer_id=challenge.customer_id and consumed_at>=period_start)>=offer.usage_limit then raise exception 'Offer usage limit reached'; end if;
  end if;
  for group_record in select * from public.loyalty_meal_deal_groups where offer_id=offer.id loop
    if (select coalesce(sum((entry->>'quantity')::integer),0) from jsonb_array_elements(coalesce(requested_items,'[]'::jsonb)) entry where (entry->>'menuItemId')::uuid in (select menu_item_id from public.loyalty_meal_deal_group_items where group_id=group_record.id))<group_record.quantity then raise exception 'Meal-deal basket requirements are not met'; end if;
  end loop;
  insert into public.loyalty_redemptions(offer_id,account_id,customer_id,consumed_by,balance_cost,benefit_snapshot,idempotency_key)
  values(offer.id,account.id,challenge.customer_id,caller,coalesce(offer.balance_cost,0),jsonb_build_object('title',offer.title,'benefitType',offer.benefit_type,'amountPence',offer.amount_pence,'percentageOff',offer.percentage_off,'staffInstructions',offer.staff_instructions),request_key)
  returning * into result;
  if coalesce(offer.balance_cost,0)>0 then
    update public.loyalty_accounts set balance=balance-offer.balance_cost,updated_at=now() where id=account.id;
    insert into public.loyalty_ledger(account_id,kind,amount,lifetime_amount,redemption_id,actor_id,idempotency_key,note) values(account.id,'redeem',-offer.balance_cost,0,result.id,caller,request_key,offer.title);
  end if;
  update public.loyalty_qr_challenges set status='consumed',consumed_at=now() where id=challenge.id;
  return result;
exception when unique_violation then select * into result from public.loyalty_redemptions where consumed_by=caller and idempotency_key=request_key; return result;
end $$;

create or replace function public.reverse_loyalty_purchase(target_purchase_id uuid,reason text,request_key text)
returns public.loyalty_purchase_events language plpgsql security definer set search_path=public as $$
declare caller uuid:=auth.uid(); purchase public.loyalty_purchase_events; entry public.loyalty_ledger; account public.loyalty_accounts;
begin
  select * into purchase from public.loyalty_purchase_events where id=target_purchase_id for update;
  if caller is null or char_length(request_key) not between 8 and 120 then raise exception 'Invalid request'; end if;
  if purchase.id is null then raise exception 'Purchase cannot be reversed'; end if;
  if purchase.reversed_at is not null and exists(
    select 1 from public.loyalty_ledger where purchase_id=purchase.id and kind='reversal'
      and left(idempotency_key,char_length(request_key)+1)=request_key||':'
  ) then return purchase; end if;
  if purchase.reversed_at is not null then raise exception 'Purchase cannot be reversed'; end if;
  if not ((purchase.verified_by=caller and purchase.created_at>now()-interval '5 minutes') or public.has_business_permission(purchase.business_id,'loyalty.reverse')) then raise exception 'Loyalty reversal access required'; end if;
  if char_length(btrim(reason)) not between 3 and 500 then raise exception 'Reversal reason required'; end if;
  for entry in select * from public.loyalty_ledger where purchase_id=purchase.id and kind='earn' for update loop
    select * into account from public.loyalty_accounts where id=entry.account_id for update;
    if account.balance<entry.amount or exists(select 1 from public.loyalty_redemptions r where r.account_id=account.id and r.consumed_at>purchase.created_at) then raise exception 'Earned value has already been used; manager resolution required'; end if;
    update public.loyalty_accounts set balance=balance-entry.amount,lifetime_earned=lifetime_earned-entry.lifetime_amount,updated_at=now() where id=account.id returning * into account;
    insert into public.loyalty_ledger(account_id,kind,amount,lifetime_amount,purchase_id,reversal_of_id,actor_id,idempotency_key,note) values(account.id,'reversal',-entry.amount,-entry.lifetime_amount,purchase.id,entry.id,caller,request_key||':'||entry.id,btrim(reason));
    delete from public.loyalty_tier_unlocks u using public.loyalty_tiers t where u.account_id=account.id and u.tier_id=t.id and t.threshold>account.lifetime_earned;
  end loop;
  update public.loyalty_purchase_events set reversed_at=now(),reversed_by=caller,reversal_reason=btrim(reason) where id=purchase.id returning * into purchase;
  return purchase;
end $$;

create or replace function public.save_event_menu_link(target_event_id uuid,target_menu_item_id uuid,badge_text text,message_text text,available_from timestamptz,available_until timestamptz,is_event_only boolean)
returns public.event_menu_items language plpgsql security definer set search_path=public as $$
declare result public.event_menu_items; business uuid;
begin
  select business_id into business from public.posts where id=target_event_id and kind='event';
  if business is null or not public.has_business_permission(business,'content.manage') or not public.has_business_permission(business,'menu.manage') then raise exception 'Content and menu access required'; end if;
  if not exists(select 1 from public.menu_items where id=target_menu_item_id and business_id=business) then raise exception 'Menu item must belong to the event business'; end if;
  if available_until<=available_from then raise exception 'Availability end must follow start'; end if;
  insert into public.event_menu_items(event_id,menu_item_id,badge,message,available_from,available_until,event_only)
  values(target_event_id,target_menu_item_id,left(coalesce(nullif(btrim(badge_text),''),'Event special'),40),left(btrim(message_text),240),available_from,available_until,is_event_only)
  on conflict(event_id,menu_item_id) do update set badge=excluded.badge,message=excluded.message,available_from=excluded.available_from,available_until=excluded.available_until,event_only=excluded.event_only returning * into result;
  return result;
end $$;

drop function if exists public.get_public_business_menu(uuid);
create function public.get_public_business_menu(target_business_id uuid)
returns table(category_id uuid,category_name text,category_sort_order integer,item_id uuid,item_name text,item_description text,item_price numeric,item_photo_url text,item_created_at timestamptz,event_id uuid,event_title text,event_badge text,event_message text,event_available_from timestamptz,event_available_until timestamptz)
language sql stable security definer set search_path=public as $$
  select c.id as category_id,c.name as category_name,c.sort_order as category_sort_order,
    i.id as item_id,i.name as item_name,i.description as item_description,i.price as item_price,
    i.photo_url as item_photo_url,i.created_at as item_created_at,
    case when p.id is not null then e.event_id end as event_id,p.title as event_title,
    case when p.id is not null then e.badge end as event_badge,
    case when p.id is not null then e.message end as event_message,
    case when p.id is not null then e.available_from end as event_available_from,
    case when p.id is not null then e.available_until end as event_available_until
  from public.businesses b join public.menu_categories c on c.business_id=b.id left join public.menu_items i on i.category_id=c.id and i.business_id=b.id and i.is_available
  left join public.event_menu_items e on e.menu_item_id=i.id and e.available_from<=now() and e.available_until>now()
  left join public.posts p on p.id=e.event_id and p.kind='event' and p.published_at<=now() and p.archived_at is null and p.event_cancelled_at is null
  where b.id=target_business_id and b.is_published and b.status='active' and (i.id is null or not exists(select 1 from public.event_menu_items eo join public.posts po on po.id=eo.event_id where eo.menu_item_id=i.id and eo.event_only and (eo.available_from>now() or eo.available_until<=now() or po.published_at is null or po.published_at>now() or po.event_cancelled_at is not null or po.archived_at is not null)))
  union all
  select null::uuid,'Other'::text,2147483647,i.id,i.name,i.description,i.price,i.photo_url,i.created_at,case when p.id is not null then e.event_id end,p.title,case when p.id is not null then e.badge end,case when p.id is not null then e.message end,case when p.id is not null then e.available_from end,case when p.id is not null then e.available_until end
  from public.businesses b join public.menu_items i on i.business_id=b.id and i.category_id is null and i.is_available
  left join public.event_menu_items e on e.menu_item_id=i.id and e.available_from<=now() and e.available_until>now()
  left join public.posts p on p.id=e.event_id and p.kind='event' and p.published_at<=now() and p.archived_at is null and p.event_cancelled_at is null
  where b.id=target_business_id and b.is_published and b.status='active' and not exists(select 1 from public.event_menu_items eo join public.posts po on po.id=eo.event_id where eo.menu_item_id=i.id and eo.event_only and (eo.available_from>now() or eo.available_until<=now() or po.published_at is null or po.published_at>now() or po.event_cancelled_at is not null or po.archived_at is not null))
  order by category_sort_order,category_name,item_created_at,item_id;
$$;

create or replace function public.set_loyalty_program_status(target_program_id uuid,next_status public.loyalty_program_status)
returns public.loyalty_programs language plpgsql security definer set search_path=public as $$
declare result public.loyalty_programs;
begin
  select * into result from public.loyalty_programs where id=target_program_id for update;
  if result.id is null or not public.has_business_permission(result.business_id,'rewards.manage') then raise exception 'Rewards management access required'; end if;
  if next_status='archived' and exists(select 1 from public.loyalty_accounts where program_id=result.id and balance>0) then raise exception 'Outstanding balances must be redeemed or migrated before archiving'; end if;
  if next_status='scheduled' and (result.starts_at is null or result.starts_at<=now()) then raise exception 'A future start date is required to schedule'; end if;
  if next_status='active' and not exists(select 1 from public.loyalty_program_versions where program_id=result.id and version=result.current_version) then raise exception 'Programme rules required'; end if;
  update public.loyalty_programs set status=next_status,archived_at=case when next_status='archived' then now() else null end,updated_at=now() where id=result.id returning * into result;
  return result;
end $$;

create or replace function public.join_loyalty_program(target_program_id uuid)
returns public.loyalty_accounts language plpgsql security definer set search_path=public as $$
declare caller uuid:=auth.uid(); program public.loyalty_programs; result public.loyalty_accounts;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  select p.* into program from public.loyalty_programs p join public.businesses b on b.id=p.business_id where p.id=target_program_id and (p.status='active' or (p.status='scheduled' and p.starts_at<=now())) and (p.ends_at is null or p.ends_at>now()) and b.status='active' and b.is_published;
  if program.id is null then raise exception 'Programme is unavailable'; end if;
  insert into public.loyalty_accounts(program_id,customer_id,joined_version) values(program.id,caller,program.current_version)
  on conflict(program_id,customer_id) do update set updated_at=public.loyalty_accounts.updated_at returning * into result;
  return result;
end $$;

create or replace function public.create_loyalty_challenge(target_business_id uuid,requested_purpose public.loyalty_challenge_purpose,target_offer_id uuid default null)
returns table(challenge_id uuid,challenge_token text,expires_at timestamptz) language plpgsql security definer set search_path=public,extensions as $$
declare caller uuid:=auth.uid(); raw_token text; created public.loyalty_qr_challenges;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.businesses where id=target_business_id and status='active' and is_published) then raise exception 'Business unavailable'; end if;
  if requested_purpose='earn' and not exists(select 1 from public.loyalty_accounts a join public.loyalty_programs p on p.id=a.program_id where a.customer_id=caller and p.business_id=target_business_id and (p.status='active' or (p.status='scheduled' and p.starts_at<=now())) and (p.ends_at is null or p.ends_at>now())) then raise exception 'Join an active programme first'; end if;
  if requested_purpose='redeem' and not exists(select 1 from public.loyalty_offers where id=target_offer_id and business_id=target_business_id and is_active) then raise exception 'Offer unavailable'; end if;
  if (select count(*) from public.loyalty_qr_challenges where customer_id=caller and created_at>now()-interval '1 minute')>=10 then
    insert into public.loyalty_fraud_events(business_id,customer_id,actor_id,event_type) values(target_business_id,caller,caller,'challenge_rate_limit'); raise exception 'Please wait before requesting another code';
  end if;
  raw_token:=encode(gen_random_bytes(32),'hex');
  insert into public.loyalty_qr_challenges(business_id,customer_id,offer_id,purpose,token_hash,expires_at)
  values(target_business_id,caller,target_offer_id,requested_purpose,encode(digest(raw_token,'sha256'),'hex'),now()+interval '60 seconds') returning * into created;
  return query select created.id,raw_token,created.expires_at;
end $$;

create or replace function public.claim_loyalty_challenge(challenge_token text)
returns table(challenge_id uuid,business_id uuid,customer_id uuid,customer_name text,purpose public.loyalty_challenge_purpose,offer_id uuid,expires_at timestamptz,error_message text)
language plpgsql security definer set search_path=public,extensions as $$
declare caller uuid:=auth.uid(); challenge public.loyalty_qr_challenges;
begin
  select * into challenge from public.loyalty_qr_challenges where token_hash=encode(digest(btrim(challenge_token),'sha256'),'hex') for update;
  if challenge.id is null or caller is null or not public.has_business_permission(challenge.business_id,'loyalty.issue') then
    return query select null::uuid,null::uuid,null::uuid,null::text,null::public.loyalty_challenge_purpose,null::uuid,null::timestamptz,'Valid staff access required'::text; return;
  end if;
  if challenge.status<>'issued' or challenge.expires_at<=now() then
    update public.loyalty_qr_challenges set status='expired' where id=challenge.id and status='issued';
    insert into public.loyalty_fraud_events(business_id,customer_id,actor_id,event_type) values(challenge.business_id,challenge.customer_id,caller,'invalid_or_replayed_challenge');
    return query select null::uuid,null::uuid,null::uuid,null::text,null::public.loyalty_challenge_purpose,null::uuid,null::timestamptz,'Code is expired or already used'::text; return;
  end if;
  challenge.expires_at:=now()+interval '5 minutes';
  update public.loyalty_qr_challenges set status='claimed',claimed_by=caller,claimed_at=now(),expires_at=challenge.expires_at where id=challenge.id;
  return query select challenge.id,challenge.business_id,challenge.customer_id,p.display_name,challenge.purpose,challenge.offer_id,challenge.expires_at,null::text from public.profiles p where p.id=challenge.customer_id;
end $$;

revoke all on function public.save_loyalty_program(uuid,uuid,jsonb), public.set_loyalty_program_status(uuid,public.loyalty_program_status), public.join_loyalty_program(uuid), public.create_loyalty_challenge(uuid,public.loyalty_challenge_purpose,uuid), public.claim_loyalty_challenge(text), public.confirm_loyalty_earning(uuid,jsonb,integer,text), public.save_loyalty_offer(uuid,uuid,jsonb), public.consume_loyalty_redemption(uuid,jsonb,text), public.reverse_loyalty_purchase(uuid,text,text), public.save_event_menu_link(uuid,uuid,text,text,timestamptz,timestamptz,boolean), public.get_public_business_menu(uuid) from public;
grant execute on function public.save_loyalty_program(uuid,uuid,jsonb), public.set_loyalty_program_status(uuid,public.loyalty_program_status), public.join_loyalty_program(uuid), public.create_loyalty_challenge(uuid,public.loyalty_challenge_purpose,uuid), public.claim_loyalty_challenge(text), public.confirm_loyalty_earning(uuid,jsonb,integer,text), public.save_loyalty_offer(uuid,uuid,jsonb), public.consume_loyalty_redemption(uuid,jsonb,text), public.reverse_loyalty_purchase(uuid,text,text), public.save_event_menu_link(uuid,uuid,text,text,timestamptz,timestamptz,boolean) to authenticated;
grant execute on function public.get_public_business_menu(uuid) to anon, authenticated;
