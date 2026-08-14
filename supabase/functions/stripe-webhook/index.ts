import { HttpError, json, required, serviceClient, stripeRequest } from '../_shared/payments.ts';

Deno.serve(async (request) => {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') ?? '';
    if (!await verifyStripe(payload, signature, required('STRIPE_WEBHOOK_SECRET'))) throw new HttpError(401, 'Invalid Stripe signature.');
    const event = JSON.parse(payload) as Record<string, unknown>;
    const id = String(event.id); const type = String(event.type); const account = event.account ? String(event.account) : null;
    const db = serviceClient();
    const inserted = await db.from('payment_webhook_events').insert({provider:'stripe',provider_event_id:id,provider_account_id:account,event_type:type,payload:event,state:'processing',attempts:1}).select('id').maybeSingle();
    if (inserted.error?.code === '23505') return json({received:true,duplicate:true});
    if (inserted.error || !inserted.data) throw inserted.error;
    try { await processEvent(event); await db.from('payment_webhook_events').update({state:'completed',processed_at:new Date().toISOString()}).eq('id',inserted.data.id); }
    catch(error){await db.from('payment_webhook_events').update({state:'failed',last_error:String(error).slice(0,500)}).eq('id',inserted.data.id);throw error;}
    return json({received:true});
  } catch(error){console.error(error);return json({error:error instanceof Error?error.message:'Webhook failed.'},error instanceof HttpError?error.status:500);}
});

async function processEvent(event:Record<string,unknown>){
  const type=String(event.type);const object=((event.data as Record<string,unknown>)?.object??{}) as Record<string,unknown>;const db=serviceClient();
  if(type==='account.updated'){
    const requirements=(object.requirements??{}) as Record<string,unknown>;const due=Array.isArray(requirements.currently_due)?requirements.currently_due:[];const ready=Boolean(object.charges_enabled)&&Boolean(object.payouts_enabled)&&due.length===0;
    await db.from('payment_connections').update({status:ready?'ready':'restricted',charges_enabled:Boolean(object.charges_enabled),payouts_enabled:Boolean(object.payouts_enabled),requirements,last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('provider','stripe').eq('provider_account_id',String(object.id));return;
  }
  if(!['payment_intent.succeeded','payment_intent.payment_failed','payment_intent.canceled'].includes(type))return;
  const attempt=await db.from('payment_attempts').select('*,orders(*)').eq('provider','stripe').eq('provider_intent_id',String(object.id)).maybeSingle();if(!attempt.data)return;
  if(type==='payment_intent.succeeded')await markSucceeded(attempt.data.id,attempt.data.order_id,attempt.data.orders?.channel,String(object.latest_charge??''));
  else {await db.from('payment_attempts').update({status:type.endsWith('canceled')?'cancelled':'failed',failure_code:(object.last_payment_error as Record<string,unknown>)?.code??null,failure_message:String((object.last_payment_error as Record<string,unknown>)?.message??'Payment failed.').slice(0,300),updated_at:new Date().toISOString()}).eq('id',attempt.data.id);await db.from('orders').update({payment_status:'failed',updated_at:new Date().toISOString()}).eq('id',attempt.data.order_id);}
}

async function markSucceeded(attemptId:string,orderId:string,channel:string,captureId:string){const db=serviceClient();const deadline=channel==='customer'?new Date(Date.now()+10*60_000).toISOString():null;await db.from('payment_attempts').update({status:'succeeded',provider_capture_id:captureId||null,succeeded_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',attemptId);await db.from('orders').update({status:channel==='customer'?'needs_confirmation':'accepted',payment_status:'paid',confirmation_deadline:deadline,accepted_at:channel==='till'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',orderId);if(deadline)await db.from('payment_jobs').upsert({type:'expire_order',order_id:orderId,status:'pending',run_at:deadline,idempotency_key:`expire:${orderId}`},{onConflict:'idempotency_key'});}

async function verifyStripe(payload:string,header:string,secret:string){const timestamp=header.split(',').find(x=>x.startsWith('t='))?.slice(2);const signatures=header.split(',').filter(x=>x.startsWith('v1=')).map(x=>x.slice(3));if(!timestamp||Math.abs(Date.now()/1000-Number(timestamp))>300)return false;const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const digest=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${payload}`));const expected=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');return signatures.some(signature=>constantTime(signature,expected));}
function constantTime(a:string,b:string){if(a.length!==b.length)return false;let value=0;for(let i=0;i<a.length;i++)value|=a.charCodeAt(i)^b.charCodeAt(i);return value===0;}
