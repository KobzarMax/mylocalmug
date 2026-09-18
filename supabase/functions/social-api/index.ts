import { decryptSecret, encryptSecret, json, randomToken, required, serviceClient, sha256, userClient } from '../_shared/social.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type' } });
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Authentication required' }, 401);
    const client = await userClient(token);
    const userResult = await client.auth.getUser();
    if (!userResult.data.user) return json({ error: 'Authentication required' }, 401);
    const body = await request.json();
    const businessId = String(body.businessId ?? '');
    const permission = await client.rpc('has_business_permission', { target_business_id: businessId, permission_key: 'social.connect' });
    if (permission.error || !permission.data) return json({ error: 'Social connection access required' }, 403);
    if (body.action === 'start_connection') return await startConnection(userResult.data.user.id, businessId, body.provider);
    if (body.action === 'list_candidates') return await listCandidates(userResult.data.user.id, String(body.sessionId ?? ''));
    if (body.action === 'select_candidate') return await selectCandidate(userResult.data.user.id, businessId, String(body.sessionId ?? ''), String(body.candidateId ?? ''));
    if (body.action === 'disconnect') return await disconnect(businessId, body.provider);
    if (body.action === 'refresh') return await refreshConnection(businessId, body.provider);
    return json({ error: 'Unsupported social action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Social request failed' }, 400);
  }
});

async function startConnection(actorId: string, businessId: string, provider: string) {
  if (!['facebook', 'instagram'].includes(provider)) return json({ error: 'Unsupported provider' }, 400);
  const state = randomToken();
  const inserted = await serviceClient().from('social_oauth_states').insert({ state_hash: await sha256(state), actor_id: actorId, business_id: businessId, provider, expires_at: new Date(Date.now() + 10 * 60_000).toISOString() }).select('id').single();
  if (inserted.error) throw inserted.error;
  const callback = required('SOCIAL_CALLBACK_URL');
  const params = new URLSearchParams({ client_id: provider === 'facebook' ? required('META_APP_ID') : required('INSTAGRAM_APP_ID'), redirect_uri: callback, response_type: 'code', state });
  if (provider === 'facebook') params.set('scope', 'pages_show_list,pages_read_engagement,pages_manage_posts');
  else params.set('scope', 'instagram_business_basic,instagram_business_content_publish');
  const base = provider === 'facebook' ? 'https://www.facebook.com/dialog/oauth' : 'https://www.instagram.com/oauth/authorize';
  return json({ authorizationUrl: `${base}?${params}` });
}

async function listCandidates(actorId: string, sessionId: string) {
  const row = await serviceClient().from('social_oauth_states').select('actor_id,candidate_ciphertext,candidate_nonce,expires_at').eq('id', sessionId).single();
  if (row.error || row.data.actor_id !== actorId || new Date(row.data.expires_at) <= new Date() || !row.data.candidate_ciphertext || !row.data.candidate_nonce) return json({ error: 'Connection session expired' }, 404);
  const candidates = JSON.parse(await decryptSecret(row.data.candidate_ciphertext, row.data.candidate_nonce));
  return json({ candidates: candidates.map(({ token: _token, ...safe }: Record<string, unknown>) => safe) });
}

async function selectCandidate(actorId: string, businessId: string, sessionId: string, candidateId: string) {
  const database = serviceClient();
  const state = await database.from('social_oauth_states').select('*').eq('id', sessionId).single();
  if (state.error || state.data.actor_id !== actorId || state.data.business_id !== businessId || !state.data.candidate_ciphertext || !state.data.candidate_nonce) return json({ error: 'Connection session unavailable' }, 404);
  const candidates = JSON.parse(await decryptSecret(state.data.candidate_ciphertext, state.data.candidate_nonce));
  const candidate = candidates.find((item: { id: string }) => item.id === candidateId);
  if (!candidate) return json({ error: 'Choose an available account' }, 400);
  await persistConnection(database, state.data, candidate, actorId);
  await database.from('social_oauth_states').update({ candidate_ciphertext: null, candidate_nonce: null }).eq('id', sessionId);
  return json({ connected: true });
}

async function disconnect(businessId: string, provider: string) {
  const database = serviceClient();
  const connection = await database.from('social_connections').select('id').eq('business_id', businessId).eq('provider', provider).maybeSingle();
  if (connection.data) await database.from('social_connection_credentials').delete().eq('connection_id', connection.data.id);
  await database.from('social_connections').update({ status: 'disabled', disconnected_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('business_id', businessId).eq('provider', provider);
  return json({ disconnected: true });
}

async function refreshConnection(businessId: string, provider: string) {
  const database = serviceClient();
  const connection = await database.from('social_connections').select('id,external_account_id').eq('business_id', businessId).eq('provider', provider).single();
  if (connection.error) return json({ error: 'Connection not found' }, 404);
  const credential = await database.from('social_connection_credentials').select('*').eq('connection_id', connection.data.id).single();
  if (credential.error) return json({ error: 'Reconnect this account' }, 409);
  const token = await decryptSecret(credential.data.token_ciphertext, credential.data.token_nonce);
  const host = provider === 'instagram' ? 'graph.instagram.com' : 'graph.facebook.com';
  const response = await fetch(`https://${host}/v23.0/${connection.data.external_account_id}?fields=id,name,username&access_token=${encodeURIComponent(token)}`);
  await database.from('social_connections').update({ status: response.ok ? 'ready' : 'expired', last_verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', connection.data.id);
  return json({ ready: response.ok });
}

export async function persistConnection(database: ReturnType<typeof serviceClient>, state: Record<string, unknown>, candidate: Record<string, unknown>, actorId: string) {
  const encrypted = await encryptSecret(String(candidate.token));
  const connection = await database.from('social_connections').upsert({ business_id: state.business_id, provider: state.provider, external_account_id: candidate.id, account_name: candidate.name, username: candidate.username ?? null, profile_url: candidate.profileUrl, granted_scopes: candidate.scopes ?? [], status: 'ready', token_expires_at: candidate.expiresAt ?? null, last_verified_at: new Date().toISOString(), disconnected_at: null, created_by: actorId, updated_at: new Date().toISOString() }, { onConflict: 'business_id,provider' }).select('id').single();
  if (connection.error) throw connection.error;
  const credentials = await database.from('social_connection_credentials').upsert({ connection_id: connection.data.id, token_ciphertext: encrypted.ciphertext, token_nonce: encrypted.nonce, token_expires_at: candidate.expiresAt ?? null, updated_at: new Date().toISOString() });
  if (credentials.error) throw credentials.error;
  const business = await database.from('businesses').select('social_links').eq('id', state.business_id).single();
  const links = business.data?.social_links && typeof business.data.social_links === 'object' ? business.data.social_links : {};
  await database.from('businesses').update({ social_links: { ...links, [String(state.provider)]: candidate.profileUrl } }).eq('id', state.business_id);
}
