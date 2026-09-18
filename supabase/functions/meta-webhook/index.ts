import { json, required, serviceClient } from '../_shared/social.ts';
import { revokedExternalAccountIds } from './events.ts';

Deno.serve(async (request) => {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    if (url.searchParams.get('hub.verify_token') !== required('META_WEBHOOK_VERIFY_TOKEN')) return new Response('Forbidden', { status: 403 });
    return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200 });
  }
  const raw = await request.text();
  if (!(await validSignature(raw, request.headers.get('x-hub-signature-256')))) return json({ error: 'Invalid signature' }, 401);
  const payload = JSON.parse(raw);
  const ids = revokedExternalAccountIds(payload);
  if (ids.length) await serviceClient().from('social_connections').update({ status: 'revoked', disconnected_at: new Date().toISOString(), updated_at: new Date().toISOString() }).in('external_account_id', ids);
  return json({ received: true });
});

async function validSignature(body: string, signature: string | null) {
  if (!signature?.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(required('META_APP_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const expected = `sha256=${[...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
}
