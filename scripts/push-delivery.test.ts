import assert from 'node:assert/strict';
import { isExpoPushToken, sendExpoMessages, uniqueByKey, type ExpoPushMessage } from '../supabase/functions/_shared/expo';

const message: ExpoPushMessage = {
  to: 'ExpoPushToken[test-device]',
  title: 'Event reminder',
  body: 'Latte art starts in one hour.',
  sound: 'default',
  channelId: 'events',
  data: { contentId: 'content-id', url: 'localmug://content/content-id' },
};

assert.equal(isExpoPushToken(message.to), true, 'Expo token should be accepted');
assert.equal(isExpoPushToken('not-a-push-token'), false, 'invalid token should be rejected');
assert.equal(uniqueByKey([{ key: 'job:device', value: 1 }, { key: 'job:device', value: 2 }]).length, 1, 'duplicate job/device work should collapse');

async function main() {
  const successFetch: typeof fetch = async () => new Response(JSON.stringify({ data: [{ status: 'ok', id: 'ticket-1' }] }), { status: 200 });
  const tickets = await sendExpoMessages([message], successFetch);
  assert.deepEqual(tickets, [{ status: 'ok', id: 'ticket-1' }], 'successful ticket response should be returned');

  const retryFetch: typeof fetch = async () => new Response('unavailable', { status: 503 });
  await assert.rejects(() => sendExpoMessages([message], retryFetch), /503/, 'transient Expo failure should surface for retry');
  await assert.rejects(() => sendExpoMessages(Array.from({ length: 101 }, () => message), successFetch), /100/, 'oversized batches should fail before sending');
  console.log('Push delivery tests passed.');
}

void main();
