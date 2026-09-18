import { decryptSecret, json, required, serviceClient } from '../_shared/social.ts';

Deno.serve(async (request) => {
  if (request.headers.get('x-cron-secret') !== required('SOCIAL_CRON_SECRET')) return json({ error: 'Unauthorized' }, 401);
  const database = serviceClient();
  const claimed = await database.rpc('claim_social_publications', { batch_size: 20 });
  if (claimed.error) return json({ error: claimed.error.message }, 500);
  const results = [];
  for (const publication of claimed.data ?? []) results.push(await dispatch(database, publication));
  return json({ processed: results.length, results });
});

async function dispatch(database: ReturnType<typeof serviceClient>, publication: Record<string, unknown>) {
  const id = String(publication.id);
  try {
    const post = await database.from('posts').select('updated_at,archived_at,event_cancelled_at').eq('id', publication.post_id).single();
    if (post.error || post.data.archived_at || post.data.updated_at !== publication.source_updated_at) return await finish(database, id, 'needs_review', 'Local Mug content changed before delivery');
    const connection = await database.from('social_connections').select('*').eq('id', publication.connection_id).single();
    if (connection.error || connection.data.status !== 'ready') return await finish(database, id, 'blocked', 'Reconnect this social account');
    const credential = await database.from('social_connection_credentials').select('*').eq('connection_id', publication.connection_id).single();
    if (credential.error) return await finish(database, id, 'blocked', 'Reconnect this social account');
    const token = await decryptSecret(credential.data.token_ciphertext, credential.data.token_nonce);
    const result = publication.provider === 'instagram'
      ? await publishInstagram(database, publication, connection.data.external_account_id, token)
      : await publishFacebook(publication, connection.data.external_account_id, token);
    await database.from('social_publication_attempts').insert({ publication_id: id, attempt_number: publication.attempts, outcome: 'published', http_status: 200 });
    await database.from('social_publications').update({ status: 'published', provider_publication_id: result.id, provider_url: result.url, published_at: new Date().toISOString(), lease_until: null, last_error: null, updated_at: new Date().toISOString() }).eq('id', id);
    return { id, status: 'published' };
  } catch (error) {
    const message = sanitize(error);
    const facebookUnknown = publication.provider === 'facebook' && message.includes('result unknown');
    const retryable = !facebookUnknown && Number(publication.attempts) < 4;
    await database.from('social_publication_attempts').insert({ publication_id: id, attempt_number: publication.attempts, outcome: facebookUnknown ? 'unknown' : retryable ? 'retry' : 'failed', sanitized_error: message });
    await database.from('social_publications').update({ status: facebookUnknown ? 'blocked' : 'failed', next_attempt_at: retryable ? new Date(Date.now() + 2 ** Number(publication.attempts) * 60_000).toISOString() : null, lease_until: null, last_error: message, updated_at: new Date().toISOString() }).eq('id', id);
    return { id, status: facebookUnknown ? 'blocked' : 'failed' };
  }
}

async function publishFacebook(publication: Record<string, unknown>, pageId: string, token: string) {
  const form = new URLSearchParams({ message: String(publication.caption), link: String(publication.content_url), access_token: token });
  let response: Response;
  try { response = await fetch(`https://graph.facebook.com/v23.0/${pageId}/feed`, { method: 'POST', body: form }); }
  catch { throw new Error('Facebook result unknown; review the Page before retrying'); }
  const body = await response.json();
  if (!response.ok || !body.id) throw new Error(metaError(body, 'Facebook rejected this post'));
  return { id: String(body.id), url: `https://www.facebook.com/${body.id}` };
}

async function publishInstagram(database: ReturnType<typeof serviceClient>, publication: Record<string, unknown>, accountId: string, token: string) {
  let containerId = publication.provider_container_id ? String(publication.provider_container_id) : '';
  if (containerId) {
    const statusResponse = await fetch(`https://graph.instagram.com/v23.0/${containerId}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    const status = await statusResponse.json();
    if (status.status_code === 'PUBLISHED') return { id: containerId, url: null };
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') containerId = '';
  }
  if (!containerId) {
    const signed = await database.storage.from('social-media').createSignedUrl(String(publication.media_path), 900);
    if (signed.error) throw signed.error;
    const form = new URLSearchParams({ image_url: signed.data.signedUrl, caption: String(publication.caption), access_token: token });
    const response = await fetch(`https://graph.instagram.com/v23.0/${accountId}/media`, { method: 'POST', body: form });
    const body = await response.json();
    if (!response.ok || !body.id) throw new Error(metaError(body, 'Instagram could not prepare this post'));
    containerId = String(body.id);
    await database.from('social_publications').update({ provider_container_id: containerId }).eq('id', publication.id);
  }
  for (let count = 0; count < 5; count++) {
    const response = await fetch(`https://graph.instagram.com/v23.0/${containerId}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    const status = await response.json();
    if (status.status_code === 'FINISHED') break;
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') throw new Error('Instagram rejected the media container');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  const publish = await fetch(`https://graph.instagram.com/v23.0/${accountId}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: containerId, access_token: token }) });
  const body = await publish.json();
  if (!publish.ok || !body.id) throw new Error(metaError(body, 'Instagram could not publish this post'));
  return { id: String(body.id), url: null };
}

async function finish(database: ReturnType<typeof serviceClient>, id: string, status: string, message: string) {
  await database.from('social_publications').update({ status, lease_until: null, last_error: message, updated_at: new Date().toISOString() }).eq('id', id);
  return { id, status };
}
function metaError(body: Record<string, unknown>, fallback: string) { const error = body.error as Record<string, unknown> | undefined; return error?.message ? String(error.message) : fallback; }
function sanitize(error: unknown) { return (error instanceof Error ? error.message : 'Social publication failed').replace(/access_token=[^&\s]+/gi, 'access_token=[redacted]').slice(0, 500); }
