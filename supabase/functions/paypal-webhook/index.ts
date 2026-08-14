import { HttpError, json, paypalRequest, required, serviceClient } from '../_shared/payments.ts';

Deno.serve(async (request) => {
  try {
    const event = await request.json() as Record<string, unknown>;
    const verified = await paypalRequest('/v1/notifications/verify-webhook-signature', { method: 'POST', body: {
      auth_algo: request.headers.get('paypal-auth-algo'), cert_url: request.headers.get('paypal-cert-url'), transmission_id: request.headers.get('paypal-transmission-id'),
      transmission_sig: request.headers.get('paypal-transmission-sig'), transmission_time: request.headers.get('paypal-transmission-time'), webhook_id: required('PAYPAL_WEBHOOK_ID'), webhook_event: event,
    } });
    if (verified.verification_status !== 'SUCCESS') throw new HttpError(401, 'Invalid PayPal signature.');
    const db = serviceClient();
    const inserted = await db.from('payment_webhook_events').insert({ provider: 'paypal', provider_event_id: String(event.id), event_type: String(event.event_type), payload: event, state: 'processing', attempts: 1 }).select('id').maybeSingle();
    if (inserted.error?.code === '23505') return json({ received: true, duplicate: true });
    if (inserted.error || !inserted.data) throw inserted.error;
    await processEvent(event);
    await db.from('payment_webhook_events').update({ state: 'completed', processed_at: new Date().toISOString() }).eq('id', inserted.data.id);
    return json({ received: true });
  } catch (error) { console.error(error); return json({ error: error instanceof Error ? error.message : 'Webhook failed.' }, error instanceof HttpError ? error.status : 500); }
});

async function processEvent(event: Record<string, unknown>) {
  const type = String(event.event_type); const resource = (event.resource ?? {}) as Record<string, unknown>; const db = serviceClient();
  if (type === 'MERCHANT.ONBOARDING.COMPLETED' || type === 'MERCHANT.PARTNER-CONSENT.REVOKED') {
    const merchant = String(resource.merchant_id ?? resource.merchantId ?? ''); const tracking = String(resource.tracking_id ?? resource.trackingId ?? '');
    if (!merchant) return;
    let ready = false; let requirements: Record<string, unknown> = {};
    if (!type.endsWith('REVOKED')) {
      const integration = await paypalRequest(`/v1/customer/partners/${required('PAYPAL_PARTNER_MERCHANT_ID')}/merchant-integrations/${merchant}`);
      const products = Array.isArray(integration.products) ? integration.products as Array<Record<string, unknown>> : [];
      ready = Boolean(integration.payments_receivable) && products.some((product) => product.name === 'EXPRESS_CHECKOUT' && product.status === 'ACTIVE'); requirements = integration;
    }
    const update = { provider_account_id: merchant, status: type.endsWith('REVOKED') ? 'revoked' : ready ? 'ready' : 'restricted', charges_enabled: ready, payouts_enabled: ready, requirements, revoked_at: type.endsWith('REVOKED') ? new Date().toISOString() : null, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const query = db.from('payment_connections').update(update).eq('provider', 'paypal');
    if (tracking) await query.eq('business_id', tracking); else await query.eq('provider_account_id', merchant);
    return;
  }
  if (type === 'PAYMENT.CAPTURE.COMPLETED') {
    const captureId = String(resource.id); const invoice = String(((resource.supplementary_data as Record<string, unknown>)?.related_ids as Record<string, unknown>)?.order_id ?? '');
    const attempt = await db.from('payment_attempts').select('*,orders(channel)').or(`provider_capture_id.eq.${captureId},provider_order_id.eq.${invoice}`).maybeSingle(); if (!attempt.data) return;
    const deadline = attempt.data.orders?.channel === 'customer' ? new Date(Date.now() + 600000).toISOString() : null;
    await db.from('payment_attempts').update({ status: 'succeeded', provider_capture_id: captureId, succeeded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', attempt.data.id);
    await db.from('orders').update({ status: deadline ? 'needs_confirmation' : 'accepted', payment_status: 'paid', confirmation_deadline: deadline, updated_at: new Date().toISOString() }).eq('id', attempt.data.order_id);
    if (deadline) await db.from('payment_jobs').upsert({ type: 'expire_order', order_id: attempt.data.order_id, status: 'pending', run_at: deadline, idempotency_key: `expire:${attempt.data.order_id}` }, { onConflict: 'idempotency_key' });
  }
}
