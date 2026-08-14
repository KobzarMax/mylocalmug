import { authenticatedUser, corsHeaders, HttpError, json, paypalRequest, randomToken, requireBusinessAccess, required, serviceClient, sha256, stripeRequest } from '../_shared/payments.ts';

type Body = { action: string; businessId?: string; orderId?: string; attemptId?: string; method?: string; amountPence?: number; idempotencyKey?: string };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { user, token } = await authenticatedUser(request);
    const body = await request.json() as Body;
    if (!body.action) throw new HttpError(400, 'Payment action is required.');
    if (body.action === 'list-connections') return json(await listConnections(user.id, requiredId(body.businessId)));
    if (body.action === 'available-methods') return json(await availableMethods(requiredId(body.businessId)));
    if (body.action === 'start-stripe-onboarding') return json(await startStripe(user.id, requiredId(body.businessId)));
    if (body.action === 'start-paypal-onboarding') return json(await startPayPal(user.id, requiredId(body.businessId)));
    if (body.action === 'refresh-connection') return json(await refreshConnection(user.id, requiredId(body.businessId), String(body.method)));
    if (body.action === 'disable-connection') return json(await disableConnection(user.id, requiredId(body.businessId), String(body.method)));
    if (body.action === 'create-stripe-payment') return json(await createStripePayment(user.id, requiredId(body.orderId), String(body.method), requiredKey(body.idempotencyKey)));
    if (body.action === 'create-paypal-payment') return json(await createPayPalPayment(user.id, requiredId(body.orderId), requiredKey(body.idempotencyKey)));
    if (body.action === 'terminal-token') return json(await terminalToken(user.id, requiredId(body.businessId)));
    if (body.action === 'setup-terminal-location') return json(await setupTerminalLocation(user.id, requiredId(body.businessId)));
    if (body.action === 'sync-terminal-readers') return json(await syncTerminalReaders(user.id, requiredId(body.businessId)));
    if (body.action === 'create-terminal-payment') return json(await createStripePayment(user.id, requiredId(body.orderId), 'terminal_card', requiredKey(body.idempotencyKey)));
    if (body.action === 'recover-order') return json(await recoverOrder(user.id, requiredId(body.orderId)));
    if (body.action === 'refund') return json(await authenticatedRpc(token, 'request_payment_refund', { target_order_id: requiredId(body.orderId), requested_amount_pence: body.amountPence, refund_reason: body.method, request_key: requiredKey(body.idempotencyKey) }));
    throw new HttpError(404, 'Unknown payment action.');
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Payment request failed.' }, error instanceof HttpError ? error.status : 500);
  }
});

async function listConnections(profileId: string, businessId: string) {
  await requireBusinessAccess(profileId, businessId, ['owner','admin','finance']);
  const result = await serviceClient().from('payment_connections').select('*').eq('business_id', businessId).order('provider');
  if (result.error) throw result.error;
  return result.data;
}
async function availableMethods(businessId:string){const result=await serviceClient().from('payment_connections').select('provider,status').eq('business_id',businessId).eq('status','ready');if(result.error)throw result.error;return{stripe:result.data.some(row=>row.provider==='stripe'),paypal:result.data.some(row=>row.provider==='paypal')};}

async function requireApprovedLegal(businessId: string) {
  const result = await serviceClient().from('business_legal_profiles').select('*').eq('business_id', businessId).eq('status', 'approved').maybeSingle();
  if (result.error || !result.data) throw new HttpError(409, 'Approve the UK legal profile before connecting a payment provider.');
  return result.data as Record<string, unknown>;
}

async function createReturnState(profileId: string, businessId: string, provider: 'stripe'|'paypal', purpose: string) {
  const token = randomToken();
  const result = await serviceClient().from('payment_return_states').insert({ business_id: businessId, profile_id: profileId, provider, purpose, token_hash: await sha256(token), expires_at: new Date(Date.now()+30*60_000).toISOString() }).select('id').single();
  if (result.error) throw result.error;
  return token;
}

async function startStripe(profileId: string, businessId: string) {
  await requireBusinessAccess(profileId, businessId, ['owner','admin']);
  const legal = await requireApprovedLegal(businessId);
  const db = serviceClient();
  const existing = await db.from('payment_connections').select('*').eq('business_id',businessId).eq('provider','stripe').maybeSingle();
  let accountId = existing.data?.provider_account_id as string|undefined;
  if (!accountId) {
    const body = new URLSearchParams({ type:'standard', country:'GB', email:String(legal.contact_email), 'capabilities[card_payments][requested]':'true', 'capabilities[transfers][requested]':'true', 'metadata[business_id]':businessId });
    const account = await stripeRequest('/accounts', { method:'POST', body, idempotencyKey:`stripe-account:${businessId}` });
    accountId = String(account.id);
    const upsert = await db.from('payment_connections').upsert({ business_id:businessId,provider:'stripe',provider_account_id:accountId,status:'onboarding',updated_at:new Date().toISOString() }, { onConflict:'business_id,provider' });
    if (upsert.error) throw upsert.error;
  }
  const state = await createReturnState(profileId,businessId,'stripe','onboarding');
  const base = required('PAYMENT_RETURN_URL');
  const links = await stripeRequest('/account_links',{ method:'POST', body:new URLSearchParams({ account:accountId, type:'account_onboarding', return_url:`${base}?provider=stripe&state=${state}`, refresh_url:`${base}?provider=stripe&state=${state}&refresh=1` }) });
  return { url:String(links.url), expiresAt:new Date(Number(links.expires_at)*1000).toISOString() };
}

async function startPayPal(profileId: string, businessId: string) {
  await requireBusinessAccess(profileId,businessId,['owner','admin']);
  await requireApprovedLegal(businessId);
  const state = await createReturnState(profileId,businessId,'paypal','onboarding');
  const callback = `${required('PAYMENT_RETURN_URL')}?provider=paypal&state=${state}`;
  const referral = await paypalRequest('/v2/customer/partner-referrals',{ method:'POST', idempotencyKey:`paypal-referral:${businessId}:${state.slice(0,12)}`, body:{ tracking_id:businessId, operations:[{ operation:'API_INTEGRATION', api_integration_preference:{ rest_api_integration:{ integration_method:'PAYPAL', integration_type:'THIRD_PARTY', third_party_details:{ features:['PAYMENT','REFUND'] } } } }], products:['EXPRESS_CHECKOUT'], legal_consents:[{ type:'SHARE_DATA_CONSENT', granted:true }], partner_config_override:{ return_url:callback, return_url_description:'Return to Local Mug' } } });
  const links = Array.isArray(referral.links) ? referral.links as Array<Record<string,unknown>> : [];
  const url = links.find((link)=>link.rel==='action_url')?.href;
  if (!url) throw new HttpError(502,'PayPal did not return an onboarding URL.');
  await serviceClient().from('payment_connections').upsert({business_id:businessId,provider:'paypal',status:'onboarding',updated_at:new Date().toISOString()},{onConflict:'business_id,provider'});
  return { url:String(url) };
}

async function refreshConnection(profileId:string,businessId:string,provider:string) {
  await requireBusinessAccess(profileId,businessId,['owner','admin','finance']);
  const db=serviceClient(); const existing=await db.from('payment_connections').select('*').eq('business_id',businessId).eq('provider',provider).maybeSingle();
  if (!existing.data) throw new HttpError(404,'Payment connection not found.');
  if (provider==='stripe' && existing.data.provider_account_id) {
    const account=await stripeRequest(`/accounts/${existing.data.provider_account_id}`);
    const requirements=(account.requirements ?? {}) as Record<string,unknown>; const due=Array.isArray(requirements.currently_due)?requirements.currently_due:[];
    const ready=Boolean(account.charges_enabled)&&Boolean(account.payouts_enabled)&&due.length===0;
    const update=await db.from('payment_connections').update({status:ready?'ready':'restricted',charges_enabled:Boolean(account.charges_enabled),payouts_enabled:Boolean(account.payouts_enabled),requirements, last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',existing.data.id).select().single();
    if(update.error)throw update.error; return update.data;
  }
  return existing.data;
}
async function disableConnection(profileId:string,businessId:string,provider:string){await requireBusinessAccess(profileId,businessId,['owner','admin']);if(!['stripe','paypal'].includes(provider))throw new HttpError(400,'Unknown provider.');const result=await serviceClient().from('payment_connections').update({status:'disabled',charges_enabled:false,payouts_enabled:false,disabled_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('business_id',businessId).eq('provider',provider).select().single();if(result.error)throw result.error;return result.data;}

async function loadPayableOrder(profileId:string,orderId:string,staff=false) {
  const db=serviceClient(); const order=await db.from('orders').select('*').eq('id',orderId).maybeSingle();
  if(order.error||!order.data)throw new HttpError(404,'Order not found.');
  if(staff) await requireBusinessAccess(profileId,order.data.business_id,['owner','admin','manager','barista']);
  else if(order.data.customer_id!==profileId) throw new HttpError(403,'Order access required.');
  if(order.data.status!=='awaiting_payment'||!['unpaid','failed'].includes(order.data.payment_status))throw new HttpError(409,'Order is not awaiting payment.');
  const connection=await db.from('payment_connections').select('*').eq('business_id',order.data.business_id).eq('provider',staff?'stripe':'stripe').eq('status','ready').maybeSingle();
  if(!connection.data?.provider_account_id)throw new HttpError(409,'Stripe is not ready for this business.');
  return {order:order.data,connection:connection.data};
}

async function createStripePayment(profileId:string,orderId:string,method:string,key:string) {
  const staff=method==='terminal_card'; const {order,connection}=await loadPayableOrder(profileId,orderId,staff);
  const body=new URLSearchParams({amount:String(order.total_pence),currency:'gbp','metadata[order_id]':order.id,'metadata[business_id]':order.business_id});
  if(staff)body.set('payment_method_types[]','card_present'); else body.set('automatic_payment_methods[enabled]','true');
  const intent=await stripeRequest('/payment_intents',{method:'POST',body,account:connection.provider_account_id,idempotencyKey:`payment:${order.id}:${key}`});
  const inserted=await serviceClient().from('payment_attempts').upsert({order_id:order.id,provider:'stripe',method,amount_pence:order.total_pence,status:'created',provider_intent_id:intent.id,idempotency_key:key},{onConflict:'order_id,idempotency_key'}).select().single();
  if(inserted.error)throw inserted.error;
  await serviceClient().from('orders').update({payment_status:'processing',updated_at:new Date().toISOString()}).eq('id',order.id);
  return {attemptId:inserted.data.id,clientSecret:intent.client_secret,connectedAccountId:connection.provider_account_id,publishableKey:required('STRIPE_PUBLISHABLE_KEY')};
}

async function createPayPalPayment(profileId:string,orderId:string,key:string) {
  const db=serviceClient(); const orderResult=await db.from('orders').select('*').eq('id',orderId).eq('customer_id',profileId).maybeSingle();
  const order=orderResult.data; if(!order||order.status!=='awaiting_payment')throw new HttpError(409,'Order is not awaiting payment.');
  const connection=await db.from('payment_connections').select('*').eq('business_id',order.business_id).eq('provider','paypal').eq('status','ready').maybeSingle();
  if(!connection.data?.provider_account_id)throw new HttpError(409,'PayPal is unavailable for this shop.');
  const state=await createReturnState(profileId,order.business_id,'paypal','checkout');
  const base=required('PAYMENT_RETURN_URL');
  const paypal=await paypalRequest('/v2/checkout/orders',{method:'POST',idempotencyKey:`paypal-order:${order.id}:${key}`,body:{intent:'CAPTURE',purchase_units:[{reference_id:order.id,invoice_id:order.id,amount:{currency_code:'GBP',value:(order.total_pence/100).toFixed(2)},payee:{merchant_id:connection.data.provider_account_id}}],payment_source:{paypal:{experience_context:{return_url:`${base}?provider=paypal&state=${state}&orderId=${order.id}`,cancel_url:`${base}?provider=paypal&state=${state}&cancel=1`,user_action:'PAY_NOW'}}}}});
  await db.from('payment_return_states').update({order_id:order.id}).eq('token_hash',await sha256(state));
  const inserted=await db.from('payment_attempts').upsert({order_id:order.id,provider:'paypal',method:'paypal',amount_pence:order.total_pence,status:'requires_action',provider_order_id:paypal.id,idempotency_key:key},{onConflict:'order_id,idempotency_key'}).select().single();
  if(inserted.error)throw inserted.error;
  const links=Array.isArray(paypal.links)?paypal.links as Array<Record<string,unknown>>:[];
  return {attemptId:inserted.data.id,approvalUrl:String(links.find((link)=>link.rel==='payer-action'||link.rel==='approve')?.href??'')};
}

async function terminalToken(profileId:string,businessId:string){await requireBusinessAccess(profileId,businessId,['owner','admin','manager','barista']);const connection=await serviceClient().from('payment_connections').select('provider_account_id,status').eq('business_id',businessId).eq('provider','stripe').maybeSingle();if(connection.data?.status!=='ready')throw new HttpError(409,'Stripe Terminal is not ready.');const token=await stripeRequest('/terminal/connection_tokens',{method:'POST',body:new URLSearchParams(),account:connection.data.provider_account_id});return{secret:token.secret};}
async function setupTerminalLocation(profileId:string,businessId:string){await requireBusinessAccess(profileId,businessId,['owner','admin']);const db=serviceClient();const connection=await db.from('payment_connections').select('provider_account_id,status').eq('business_id',businessId).eq('provider','stripe').maybeSingle();if(connection.data?.status!=='ready')throw new HttpError(409,'Connect Stripe before setting up Terminal.');const local=await db.from('business_locations').select('*').eq('business_id',businessId).eq('is_primary',true).maybeSingle();const legal=await requireApprovedLegal(businessId);if(!local.data)throw new HttpError(409,'Primary business location required.');const existing=await db.from('terminal_locations').select('*').eq('business_id',businessId).eq('business_location_id',local.data.id).maybeSingle();if(existing.data)return existing.data;const provider=await stripeRequest('/terminal/locations',{method:'POST',account:connection.data.provider_account_id,idempotencyKey:`terminal-location:${local.data.id}`,body:new URLSearchParams({'display_name':local.data.name,'address[line1]':String(legal.registered_address_line1),'address[line2]':String(legal.registered_address_line2??''),'address[city]':String(legal.registered_town_city),'address[state]':String(legal.registered_county??''),'address[country]':'GB','address[postal_code]':String(legal.registered_postcode)})});const inserted=await db.from('terminal_locations').insert({business_id:businessId,business_location_id:local.data.id,provider_location_id:provider.id}).select().single();if(inserted.error)throw inserted.error;return inserted.data;}
async function syncTerminalReaders(profileId:string,businessId:string){await requireBusinessAccess(profileId,businessId,['owner','admin','manager','barista']);const db=serviceClient();const connection=await db.from('payment_connections').select('provider_account_id,status').eq('business_id',businessId).eq('provider','stripe').single();const location=await db.from('terminal_locations').select('*').eq('business_id',businessId).eq('active',true).limit(1).single();if(!connection.data?.provider_account_id||!location.data)throw new HttpError(409,'Terminal setup is incomplete.');const response=await stripeRequest(`/terminal/readers?location=${encodeURIComponent(location.data.provider_location_id)}`,{account:connection.data.provider_account_id});const readers=Array.isArray(response.data)?response.data as Array<Record<string,unknown>>:[];if(readers.length){const saved=await db.from('terminal_readers').upsert(readers.map(reader=>({business_id:businessId,terminal_location_id:location.data.id,provider_reader_id:reader.id,label:reader.label??reader.serial_number??'Card reader',device_type:reader.device_type??'unknown',status:reader.status??'offline',last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()})),{onConflict:'provider_reader_id'});if(saved.error)throw saved.error;}return{count:readers.length};}
async function recoverOrder(profileId:string,orderId:string){const db=serviceClient();const result=await db.from('orders').select('*,order_items(*),payment_attempts(*),payment_refunds(*)').eq('id',orderId).maybeSingle();if(!result.data)throw new HttpError(404,'Order not found.');if(result.data.customer_id!==profileId)await requireBusinessAccess(profileId,result.data.business_id,['owner','admin','manager','finance','barista']);return result.data;}
async function authenticatedRpc(token:string,name:string,args:Record<string,unknown>){const client=(await import('https://esm.sh/@supabase/supabase-js@2.110.0')).createClient(required('SUPABASE_URL'),required('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:`Bearer ${token}`}}});const result=await client.rpc(name,args);if(result.error)throw new HttpError(400,result.error.message);return result.data;}
function requiredId(value?:string){if(!value||!/^[0-9a-f-]{36}$/i.test(value))throw new HttpError(400,'Valid ID required.');return value;}
function requiredKey(value?:string){if(!value||value.length<8||value.length>120)throw new HttpError(400,'Valid idempotency key required.');return value;}
