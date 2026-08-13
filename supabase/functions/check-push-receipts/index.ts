import { authorizeCron, json, serviceClient } from '../_shared/cron.ts';

type Delivery = { id: string; job_id: string; device_id: string; expo_ticket_id: string; attempts: number };

Deno.serve(async (request) => {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;
  try {
    const supabase = serviceClient();
    const result = await supabase.from('push_deliveries')
      .select('id, job_id, device_id, expo_ticket_id, attempts')
      .eq('status', 'ticketed').not('expo_ticket_id', 'is', null).limit(300);
    if (result.error) throw result.error;
    const deliveries = (result.data ?? []) as Delivery[];
    if (!deliveries.length) return json({ checked: 0 });

    const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ ids: deliveries.map((delivery) => delivery.expo_ticket_id) }),
    });
    if (!response.ok) throw new Error(`Expo receipt request failed with ${response.status}`);
    const payload = await response.json() as { data?: Record<string, { status: string; message?: string; details?: { error?: string } }> };
    const receipts = payload.data ?? {};

    for (const delivery of deliveries) {
      const receipt = receipts[delivery.expo_ticket_id];
      if (!receipt) continue;
      if (receipt.status === 'ok') {
        await supabase.from('push_deliveries').update({ status: 'delivered', last_error: null, updated_at: new Date().toISOString() }).eq('id', delivery.id);
        continue;
      }
      const errorCode = receipt.details?.error;
      if (errorCode === 'DeviceNotRegistered') {
        await supabase.from('push_devices').update({ enabled: false, updated_at: new Date().toISOString() }).eq('id', delivery.device_id);
        await supabase.from('push_deliveries').update({ status: 'failed', last_error: errorCode, next_attempt_at: null, updated_at: new Date().toISOString() }).eq('id', delivery.id);
        continue;
      }
      const terminal = delivery.attempts >= 5 || ['MessageTooBig', 'InvalidCredentials'].includes(errorCode ?? '');
      const nextAttempt = terminal ? null : new Date(Date.now() + Math.min(30, 2 ** delivery.attempts) * 60_000).toISOString();
      await supabase.from('push_deliveries').update({
        status: terminal ? 'failed' : 'pending',
        expo_ticket_id: null,
        last_error: (receipt.message ?? errorCode ?? 'Push receipt failed.').slice(0, 500),
        next_attempt_at: nextAttempt,
        updated_at: new Date().toISOString(),
      }).eq('id', delivery.id);
      if (!terminal) {
        await supabase.from('event_notification_jobs').update({ status: 'pending', next_attempt_at: nextAttempt, processed_at: null }).eq('id', delivery.job_id);
      }
    }
    return json({ checked: deliveries.length });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Receipt check failed.' }, 500);
  }
});
