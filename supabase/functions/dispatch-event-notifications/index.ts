import { authorizeCron, json, serviceClient } from '../_shared/cron.ts';
import { isExpoPushToken, sendExpoMessages } from '../_shared/expo.ts';

type NotificationJob = {
  id: string;
  post_id: string;
  job_type: 'reminder' | 'updated' | 'cancelled';
  reminder_minutes: number;
  event_version: number;
  attempts: number;
};

type PushDevice = { id: string; profile_id: string; expo_push_token: string };
type Delivery = { id: string; device_id: string; status: string; attempts: number; next_attempt_at: string | null };

Deno.serve(async (request) => {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;
  try {
    const supabase = serviceClient();
    const claimed = await supabase.rpc('claim_event_notification_jobs', { batch_size: 25 });
    if (claimed.error) throw claimed.error;
    const results = [];
    for (const job of (claimed.data ?? []) as NotificationJob[]) {
      results.push(await dispatchJob(supabase, job));
    }
    return json({ processed: results.length, results });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Notification dispatch failed.' }, 500);
  }
});

async function dispatchJob(supabase: ReturnType<typeof serviceClient>, job: NotificationJob) {
  const postResult = await supabase.from('posts').select(
    'id, business_id, title, excerpt, kind, published_at, archived_at, event_starts_at, event_cancelled_at, event_notification_version, businesses!inner(name, is_published)',
  ).eq('id', job.post_id).maybeSingle();
  if (postResult.error) return failJob(supabase, job, postResult.error.message);
  const post = postResult.data;
  const business = Array.isArray(post?.businesses) ? post.businesses[0] : post?.businesses;
  const invalid = !post || post.kind !== 'event' || !business?.is_published || !post.published_at
    || new Date(post.published_at) > new Date() || post.archived_at
    || post.event_notification_version !== job.event_version
    || (job.job_type !== 'cancelled' && Boolean(post.event_cancelled_at));
  if (invalid) {
    await supabase.from('event_notification_jobs').update({ status: 'cancelled', processed_at: new Date().toISOString() }).eq('id', job.id);
    return { id: job.id, status: 'cancelled' };
  }

  const followers = await supabase.from('business_followers').select('client_id')
    .eq('business_id', post.business_id).eq('event_notifications_enabled', true);
  if (followers.error) return failJob(supabase, job, followers.error.message);
  const profileIds = (followers.data ?? []).map((row) => row.client_id);
  if (!profileIds.length) return completeJob(supabase, job.id, 0);
  const devicesResult = await supabase.from('push_devices').select('id, profile_id, expo_push_token')
    .in('profile_id', profileIds).eq('enabled', true);
  if (devicesResult.error) return failJob(supabase, job, devicesResult.error.message);
  const devices = ((devicesResult.data ?? []) as PushDevice[]).filter((device) => isExpoPushToken(device.expo_push_token));
  if (!devices.length) return completeJob(supabase, job.id, 0);

  const inserted = await supabase.from('push_deliveries').upsert(
    devices.map((device) => ({ job_id: job.id, device_id: device.id })),
    { onConflict: 'job_id,device_id', ignoreDuplicates: true },
  );
  if (inserted.error) return failJob(supabase, job, inserted.error.message);
  const deliveriesResult = await supabase.from('push_deliveries').select('id, device_id, status, attempts, next_attempt_at')
    .eq('job_id', job.id).in('status', ['pending', 'failed']);
  if (deliveriesResult.error) return failJob(supabase, job, deliveriesResult.error.message);
  const deviceById = new Map(devices.map((device) => [device.id, device]));
  const retryable = ((deliveriesResult.data ?? []) as Delivery[]).filter((delivery) => delivery.attempts < 5 && deviceById.has(delivery.device_id));
  const deliveries = retryable.filter((delivery) => !delivery.next_attempt_at || new Date(delivery.next_attempt_at) <= new Date());
  if (!deliveries.length && retryable.length) {
    const nextAttempt = retryable.map((delivery) => delivery.next_attempt_at).filter(Boolean).sort()[0];
    await supabase.from('event_notification_jobs').update({ status: 'pending', next_attempt_at: nextAttempt }).eq('id', job.id);
    return { id: job.id, status: 'waiting' };
  }
  const copy = notificationCopy(job, post.title, business.name);
  let retryNeeded = false;

  for (let offset = 0; offset < deliveries.length; offset += 100) {
    const batch = deliveries.slice(offset, offset + 100);
    let tickets;
    try {
      tickets = await sendExpoMessages(batch.map((delivery) => ({
        to: deviceById.get(delivery.device_id)!.expo_push_token,
        title: copy.title,
        body: copy.body,
        sound: 'default',
        channelId: 'events',
        data: { contentId: post.id, url: `localmug://content/${post.id}` },
      } as const)));
    } catch (error) {
      return failJob(supabase, job, error instanceof Error ? error.message : 'Expo push request failed.');
    }
    for (let index = 0; index < batch.length; index += 1) {
      const delivery = batch[index];
      const ticket = tickets[index];
      const errorCode = ticket?.details?.error;
      const disabled = errorCode === 'DeviceNotRegistered';
      if (disabled) {
        await supabase.from('push_devices').update({ enabled: false, updated_at: new Date().toISOString() }).eq('id', delivery.device_id);
      }
      if (ticket?.status !== 'ok' && !disabled) retryNeeded = true;
      await supabase.from('push_deliveries').update({
        status: ticket?.status === 'ok' && ticket.id ? 'ticketed' : 'failed',
        expo_ticket_id: ticket?.id ?? null,
        attempts: delivery.attempts + 1,
        last_error: ticket?.status === 'ok' ? null : errorCode ?? ticket?.message ?? 'Expo rejected the notification.',
        next_attempt_at: ticket?.status === 'ok' || disabled ? null : retryAt(delivery.attempts + 1),
        updated_at: new Date().toISOString(),
      }).eq('id', delivery.id);
    }
  }
  if (retryNeeded) return failJob(supabase, job, 'One or more Expo push tickets require retry.');
  return completeJob(supabase, job.id, devices.length);
}

function notificationCopy(job: NotificationJob, eventTitle: string, businessName: string) {
  if (job.job_type === 'cancelled') return { title: `${businessName} event cancelled`, body: eventTitle };
  if (job.job_type === 'updated') return { title: `${businessName} event updated`, body: `Check the new details for ${eventTitle}.` };
  const timing = job.reminder_minutes === 60 ? 'in 1 hour' : job.reminder_minutes === 1440 ? 'tomorrow' : 'in 1 week';
  return { title: `${businessName} event ${timing}`, body: eventTitle };
}

async function completeJob(supabase: ReturnType<typeof serviceClient>, id: string, devices: number) {
  await supabase.from('event_notification_jobs').update({ status: 'completed', processed_at: new Date().toISOString(), next_attempt_at: null }).eq('id', id);
  return { id, status: 'completed', devices };
}

async function failJob(supabase: ReturnType<typeof serviceClient>, job: NotificationJob, message: string) {
  const terminal = job.attempts >= 5;
  await supabase.from('event_notification_jobs').update({
    status: terminal ? 'failed' : 'pending',
    last_error: message.slice(0, 500),
    next_attempt_at: terminal ? null : retryAt(job.attempts),
    processed_at: terminal ? new Date().toISOString() : null,
  }).eq('id', job.id);
  return { id: job.id, status: terminal ? 'failed' : 'retrying' };
}

function retryAt(attempt: number) {
  return new Date(Date.now() + Math.min(30, 2 ** Math.max(0, attempt)) * 60_000).toISOString();
}
