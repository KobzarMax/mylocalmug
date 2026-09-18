import { encryptSecret, required, serviceClient, sha256 } from '../_shared/social.ts';

Deno.serve(async (request) => {
  const url = new URL(request.url);
  const fallback = Deno.env.get('SOCIAL_APP_RETURN_URL') ?? 'localmug://business/social';
  try {
    const stateValue = url.searchParams.get('state') ?? '';
    const code = url.searchParams.get('code') ?? '';
    if (!stateValue || !code) throw new Error('Meta did not return an authorization code');
    const database = serviceClient();
    const state = await database.from('social_oauth_states').select('*').eq('state_hash', await sha256(stateValue)).is('consumed_at', null).gt('expires_at', new Date().toISOString()).single();
    if (state.error) throw new Error('This connection link is invalid or expired');
    const candidates = state.data.provider === 'facebook' ? await facebookCandidates(code) : [await instagramCandidate(code)];
    await database.from('social_oauth_states').update({ consumed_at: new Date().toISOString() }).eq('id', state.data.id);
    if (candidates.length === 1) {
      await persistConnection(database, state.data, candidates[0]);
      return Response.redirect(`${fallback}?connected=${state.data.provider}`, 302);
    }
    const encrypted = await encryptSecret(JSON.stringify(candidates));
    await database.from('social_oauth_states').update({ candidate_ciphertext: encrypted.ciphertext, candidate_nonce: encrypted.nonce }).eq('id', state.data.id);
    return Response.redirect(`${fallback}?session=${state.data.id}`, 302);
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : 'Social connection failed');
    return Response.redirect(`${fallback}?social_error=${message}`, 302);
  }
});

async function facebookCandidates(code: string) {
  const params = new URLSearchParams({ client_id: required('META_APP_ID'), client_secret: required('META_APP_SECRET'), redirect_uri: required('SOCIAL_CALLBACK_URL'), code });
  const tokenResponse = await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?${params}`);
  const tokenBody = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenBody.access_token) throw new Error('Facebook authorization failed');
  const pagesResponse = await fetch(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,tasks,link&access_token=${encodeURIComponent(tokenBody.access_token)}`);
  const pages = await pagesResponse.json();
  if (!pagesResponse.ok || !Array.isArray(pages.data) || !pages.data.length) throw new Error('No manageable Facebook Page was found');
  return pages.data.filter((page: { tasks?: string[] }) => page.tasks?.includes('CREATE_CONTENT') || page.tasks?.includes('MANAGE')).map((page: Record<string, unknown>) => ({ id: page.id, name: page.name, username: null, profileUrl: page.link ?? `https://www.facebook.com/${page.id}`, token: page.access_token, scopes: ['pages_show_list','pages_read_engagement','pages_manage_posts'], expiresAt: null }));
}

async function instagramCandidate(code: string) {
  const form = new FormData();
  form.set('client_id', required('INSTAGRAM_APP_ID'));
  form.set('client_secret', required('INSTAGRAM_APP_SECRET'));
  form.set('grant_type', 'authorization_code');
  form.set('redirect_uri', required('SOCIAL_CALLBACK_URL'));
  form.set('code', code);
  const shortResponse = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form });
  const short = await shortResponse.json();
  if (!shortResponse.ok || !short.access_token) throw new Error('Instagram authorization failed');
  const longResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(required('INSTAGRAM_APP_SECRET'))}&access_token=${encodeURIComponent(short.access_token)}`);
  const long = await longResponse.json();
  const token = long.access_token ?? short.access_token;
  const profileResponse = await fetch(`https://graph.instagram.com/v23.0/me?fields=user_id,username,name,account_type&access_token=${encodeURIComponent(token)}`);
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !['BUSINESS','MEDIA_CREATOR'].includes(profile.account_type)) throw new Error('Connect an Instagram Professional account');
  return { id: String(profile.user_id ?? profile.id), name: profile.name ?? profile.username, username: profile.username, profileUrl: `https://www.instagram.com/${profile.username}`, token, scopes: ['instagram_business_basic','instagram_business_content_publish'], expiresAt: new Date(Date.now() + Number(long.expires_in ?? 5_184_000) * 1000).toISOString() };
}

async function persistConnection(database: ReturnType<typeof serviceClient>, state: Record<string, unknown>, candidate: Record<string, unknown>) {
  const encrypted = await encryptSecret(String(candidate.token));
  const connection = await database.from('social_connections').upsert({ business_id: state.business_id, provider: state.provider, external_account_id: candidate.id, account_name: candidate.name, username: candidate.username ?? null, profile_url: candidate.profileUrl, granted_scopes: candidate.scopes ?? [], status: 'ready', token_expires_at: candidate.expiresAt ?? null, last_verified_at: new Date().toISOString(), disconnected_at: null, created_by: state.actor_id, updated_at: new Date().toISOString() }, { onConflict: 'business_id,provider' }).select('id').single();
  if (connection.error) throw connection.error;
  await database.from('social_connection_credentials').upsert({ connection_id: connection.data.id, token_ciphertext: encrypted.ciphertext, token_nonce: encrypted.nonce, token_expires_at: candidate.expiresAt ?? null, updated_at: new Date().toISOString() });
  const business = await database.from('businesses').select('social_links').eq('id', state.business_id).single();
  const links = business.data?.social_links && typeof business.data.social_links === 'object' ? business.data.social_links : {};
  await database.from('businesses').update({ social_links: { ...links, [String(state.provider)]: candidate.profileUrl } }).eq('id', state.business_id);
}
