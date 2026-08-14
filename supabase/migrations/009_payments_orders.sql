-- UK payments, order lifecycle, and Terminal security.
-- Apply after drizzle/0006_open_joystick.sql and 008_uk_legal_profiles.sql.

create or replace function public.business_role_has_permission(member_role public.business_member_role, permission_key text)
returns boolean language sql immutable set search_path = public as $$
  select case
    when member_role = 'owner' then true
    when member_role = 'admin' then permission_key <> 'ownership.transfer'
    when member_role = 'manager' then permission_key = any(array[
      'business.profile.read','business.profile.write','menu.manage','content.manage','rewards.manage',
      'team.read','analytics.read','payments.charge','orders.read','orders.manage'
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

alter table public.payment_connections enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.payment_return_states enable row level security;
alter table public.payment_jobs enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.payment_refunds enable row level security;
alter table public.terminal_locations enable row level security;
alter table public.terminal_readers enable row level security;

revoke all on public.payment_connections, public.payment_webhook_events, public.payment_return_states,
  public.payment_jobs, public.orders, public.order_items, public.payment_attempts,
  public.payment_refunds, public.terminal_locations, public.terminal_readers from anon, authenticated;
grant select on public.payment_connections, public.orders, public.order_items, public.payment_attempts,
  public.payment_refunds, public.terminal_locations, public.terminal_readers to authenticated;

create policy "members read payment connections" on public.payment_connections for select to authenticated
using (public.has_business_permission(business_id, 'payments.read'));
create policy "customer and staff read orders" on public.orders for select to authenticated
using (customer_id = auth.uid() or public.has_business_permission(business_id, 'orders.read') or public.has_business_permission(business_id, 'payments.read'));
create policy "customer and staff read order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_items.order_id and
  (o.customer_id = auth.uid() or public.has_business_permission(o.business_id, 'orders.read') or public.has_business_permission(o.business_id, 'payments.read'))));
create policy "customer and finance read attempts" on public.payment_attempts for select to authenticated
using (exists (select 1 from public.orders o where o.id = payment_attempts.order_id and
  (o.customer_id = auth.uid() or public.has_business_permission(o.business_id, 'payments.read'))));
create policy "customer and finance read refunds" on public.payment_refunds for select to authenticated
using (exists (select 1 from public.orders o where o.id = payment_refunds.order_id and
  (o.customer_id = auth.uid() or public.has_business_permission(o.business_id, 'payments.read'))));
create policy "till staff read terminal locations" on public.terminal_locations for select to authenticated
using (public.has_business_permission(business_id, 'payments.charge'));
create policy "till staff read terminal readers" on public.terminal_readers for select to authenticated
using (public.has_business_permission(business_id, 'payments.charge'));

create or replace function public.create_trusted_order(
  target_business_id uuid, requested_channel public.order_channel, requested_items jsonb, request_key text
) returns public.orders language plpgsql security definer set search_path = public as $$
declare caller uuid := auth.uid(); location_record public.business_locations; result public.orders;
declare item jsonb; menu_record public.menu_items; qty integer; calculated integer := 0; local_now timestamp;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  if request_key is null or char_length(request_key) not between 8 and 120 then raise exception 'Invalid idempotency key'; end if;
  if jsonb_typeof(requested_items) <> 'array' or jsonb_array_length(requested_items) not between 1 and 50 then raise exception 'Basket must contain 1 to 50 items'; end if;
  if requested_channel = 'till' and not public.has_business_permission(target_business_id, 'payments.charge') then raise exception 'Till access required'; end if;
  if requested_channel = 'customer' and not exists(select 1 from public.profiles where id = caller and role = 'client') then raise exception 'Customer account required'; end if;
  select * into location_record from public.business_locations where business_id = target_business_id and is_primary order by created_at limit 1;
  if location_record.id is null then raise exception 'Primary pickup location required'; end if;
  if requested_channel = 'customer' then
    if not exists(select 1 from public.businesses where id = target_business_id and status = 'active' and is_published) then raise exception 'Business is not accepting orders'; end if;
    local_now := now() at time zone location_record.timezone;
    if not exists(select 1 from public.business_hours h where h.location_id = location_record.id
      and h.day_of_week = extract(isodow from local_now)::integer - 1 and not h.is_closed
      and local_now::time >= h.opens_at::time and local_now::time < h.closes_at::time) then raise exception 'Business is currently closed'; end if;
  end if;
  select * into result from public.orders where created_by = caller and idempotency_key = request_key;
  if result.id is not null then return result; end if;
  insert into public.orders (business_id, location_id, customer_id, created_by, channel, subtotal_pence, total_pence, idempotency_key)
  values (target_business_id, location_record.id, case when requested_channel='customer' then caller else null end, caller, requested_channel, 0, 0, request_key)
  returning * into result;
  for item in select * from jsonb_array_elements(requested_items) loop
    begin qty := (item->>'quantity')::integer; exception when others then raise exception 'Invalid quantity'; end;
    if qty not between 1 and 99 then raise exception 'Quantity must be between 1 and 99'; end if;
    select * into menu_record from public.menu_items where id=(item->>'menuItemId')::uuid and business_id=target_business_id and is_available for share;
    if menu_record.id is null then raise exception 'Menu item is unavailable'; end if;
    insert into public.order_items(order_id,menu_item_id,name,quantity,unit_price_pence,line_total_pence)
    values(result.id,menu_record.id,menu_record.name,qty,round(menu_record.price*100)::integer,round(menu_record.price*100)::integer*qty);
    calculated := calculated + round(menu_record.price*100)::integer*qty;
  end loop;
  if calculated <= 0 then raise exception 'Order total must be positive'; end if;
  update public.orders set subtotal_pence=calculated,total_pence=calculated where id=result.id returning * into result;
  return result;
end $$;

create or replace function public.cancel_unpaid_order(target_order_id uuid)
returns public.orders language plpgsql security definer set search_path=public as $$
declare result public.orders;
begin
  select * into result from public.orders where id=target_order_id for update;
  if result.id is null or result.created_by <> auth.uid() then raise exception 'Order access required'; end if;
  if result.status <> 'awaiting_payment' or result.payment_status not in ('unpaid','failed') then raise exception 'Only unpaid orders can be cancelled'; end if;
  update public.orders set status='cancelled',cancellation_reason='Cancelled before payment',updated_at=now() where id=target_order_id returning * into result;
  return result;
end $$;

create or replace function public.update_order_fulfilment(target_order_id uuid, next_status public.order_status, reason text default null)
returns public.orders language plpgsql security definer set search_path=public as $$
declare result public.orders; valid boolean := false;
begin
  select * into result from public.orders where id=target_order_id for update;
  if result.id is null or not public.has_business_permission(result.business_id,'orders.manage') then raise exception 'Order management access required'; end if;
  valid := (result.status='needs_confirmation' and next_status in ('accepted','refund_pending'))
    or (result.status='accepted' and next_status='preparing') or (result.status='preparing' and next_status='ready')
    or (result.status='ready' and next_status='completed');
  if not valid then raise exception 'Invalid order transition'; end if;
  if next_status='refund_pending' then
    update public.orders set status='refund_pending',payment_status='refund_pending',cancellation_reason=left(coalesce(nullif(btrim(reason),''),'Rejected by shop'),500),updated_at=now() where id=target_order_id returning * into result;
    insert into public.payment_jobs(type,order_id,status,run_at,idempotency_key) values('refund',result.id,'pending',now(),'order-rejection:'||result.id) on conflict(idempotency_key) do nothing;
  else
    update public.orders set status=next_status,accepted_at=case when next_status='accepted' then now() else accepted_at end,
      completed_at=case when next_status='completed' then now() else completed_at end,updated_at=now() where id=target_order_id returning * into result;
  end if;
  return result;
end $$;

create or replace function public.request_payment_refund(target_order_id uuid, requested_amount_pence integer, refund_reason text, request_key text)
returns public.payment_refunds language plpgsql security definer set search_path=public as $$
declare target public.orders; attempt public.payment_attempts; result public.payment_refunds; available integer;
begin
  select * into target from public.orders where id=target_order_id for update;
  if target.id is null or not public.has_business_permission(target.business_id,'payments.refund') then raise exception 'Refund access required'; end if;
  select * into attempt from public.payment_attempts where order_id=target.id and status in ('succeeded','partially_refunded') order by succeeded_at desc nulls last limit 1;
  if attempt.id is null then raise exception 'Successful payment required'; end if;
  available := target.total_pence-target.refunded_pence;
  if requested_amount_pence <= 0 or requested_amount_pence > available then raise exception 'Refund exceeds refundable amount'; end if;
  if char_length(btrim(refund_reason)) not between 3 and 500 then raise exception 'Refund reason is required'; end if;
  insert into public.payment_refunds(order_id,payment_attempt_id,amount_pence,reason,requested_by,idempotency_key)
  values(target.id,attempt.id,requested_amount_pence,btrim(refund_reason),auth.uid(),request_key)
  on conflict(payment_attempt_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning * into result;
  insert into public.payment_jobs(type,order_id,refund_id,status,run_at,idempotency_key)
  values('refund',target.id,result.id,'pending',now(),'refund:'||result.id) on conflict(idempotency_key) do nothing;
  update public.orders set payment_status='refund_pending',updated_at=now() where id=target.id;
  return result;
end $$;

revoke all on function public.create_trusted_order(uuid,public.order_channel,jsonb,text) from public, anon;
revoke all on function public.cancel_unpaid_order(uuid) from public, anon;
revoke all on function public.update_order_fulfilment(uuid,public.order_status,text) from public, anon;
revoke all on function public.request_payment_refund(uuid,integer,text,text) from public, anon;
grant execute on function public.create_trusted_order(uuid,public.order_channel,jsonb,text) to authenticated;
grant execute on function public.cancel_unpaid_order(uuid) to authenticated;
grant execute on function public.update_order_fulfilment(uuid,public.order_status,text) to authenticated;
grant execute on function public.request_payment_refund(uuid,integer,text,text) to authenticated;

create or replace function public.claim_payment_jobs(batch_size integer default 25)
returns setof public.payment_jobs language sql security definer set search_path=public as $$
  update public.payment_jobs job set status='processing',lease_until=now()+interval '2 minutes',attempts=job.attempts+1,updated_at=now()
  where job.id in (select candidate.id from public.payment_jobs candidate where
    (candidate.status='pending' or (candidate.status='processing' and candidate.lease_until<now())) and candidate.run_at<=now()
    order by candidate.run_at for update skip locked limit greatest(1,least(batch_size,100)))
  returning job.*;
$$;
revoke all on function public.claim_payment_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_payment_jobs(integer) to service_role;

-- Realtime publication is intentionally limited to orders; RLS still filters delivery.
do $$ begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end $$;

-- Cron calls the worker with the same Vault-backed pattern used by event notifications.
-- Configure PAYMENT_CRON_SECRET and the project URL, then schedule process-payment-jobs every minute.
