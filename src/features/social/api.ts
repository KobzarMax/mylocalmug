import { supabase } from '../../lib/supabase';

import { SocialAccountCandidate, SocialConnection, SocialPlatform, SocialPublication } from './types';

export async function getSocialConnections(businessId: string): Promise<SocialConnection[]> {
  const result = await supabase.rpc('get_business_social_connections', { target_business_id: businessId });
  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => ({
    id: String(row.id),
    provider: row.provider as SocialPlatform,
    accountName: String(row.account_name),
    username: row.username ? String(row.username) : null,
    profileUrl: String(row.profile_url),
    status: row.status as SocialConnection['status'],
    tokenExpiresAt: row.token_expires_at ? String(row.token_expires_at) : null,
    lastVerifiedAt: row.last_verified_at ? String(row.last_verified_at) : null,
  }));
}

export async function startSocialConnection(businessId: string, provider: SocialPlatform) {
  const result = await supabase.functions.invoke('social-api', {
    body: { action: 'start_connection', businessId, provider },
  });
  if (result.error) throw result.error;
  return result.data as { authorizationUrl: string };
}

export async function getSocialCandidates(businessId: string, sessionId: string) {
  const result = await supabase.functions.invoke('social-api', {
    body: { action: 'list_candidates', businessId, sessionId },
  });
  if (result.error) throw result.error;
  return result.data.candidates as SocialAccountCandidate[];
}

export async function selectSocialCandidate(businessId: string, sessionId: string, candidateId: string) {
  const result = await supabase.functions.invoke('social-api', {
    body: { action: 'select_candidate', businessId, sessionId, candidateId },
  });
  if (result.error) throw result.error;
}

export async function disconnectSocialConnection(businessId: string, provider: SocialPlatform) {
  const result = await supabase.functions.invoke('social-api', {
    body: { action: 'disconnect', businessId, provider },
  });
  if (result.error) throw result.error;
}

export async function queueSocialPublications(input: {
  businessId: string;
  postId: string;
  publicationType: 'initial' | 'update' | 'cancellation';
  dueAt: string;
  contentUrl: string;
  captions: Partial<Record<SocialPlatform, string>>;
  mediaPath: string | null;
}) {
  const result = await supabase.rpc('queue_social_publications', {
    target_business_id: input.businessId,
    target_post_id: input.postId,
    publication_type_input: input.publicationType,
    publication_due_at: input.dueAt,
    publication_content_url: input.contentUrl,
    publication_captions: input.captions,
    publication_media_path: input.mediaPath ?? undefined,
  });
  if (result.error) throw result.error;
  return result.data as string[];
}

export async function createSocialMediaSnapshot(businessId: string, postId: string, coverPath: string) {
  if (!/\.jpe?g$/i.test(coverPath))
    throw new Error('Instagram requires a JPEG cover. Replace this cover first.');
  const signed = await supabase.storage.from('content-media').createSignedUrl(coverPath, 300);
  if (signed.error) throw signed.error;
  const response = await fetch(signed.data.signedUrl);
  if (!response.ok) throw new Error('Could not prepare the social cover.');
  const bytes = await response.arrayBuffer();
  const path = `${businessId}/social/${postId}/${Date.now()}.jpg`;
  const uploaded = await supabase.storage
    .from('social-media')
    .upload(path, bytes, { contentType: 'image/jpeg' });
  if (uploaded.error) throw uploaded.error;
  return path;
}

export async function getSocialPublications(postId: string): Promise<SocialPublication[]> {
  const result = await supabase.rpc('get_post_social_publications', { target_post_id: postId });
  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => ({
    id: String(row.id),
    postId,
    provider: row.provider as SocialPlatform,
    publicationType: row.publication_type as SocialPublication['publicationType'],
    caption: String(row.caption),
    dueAt: String(row.due_at),
    status: row.status as SocialPublication['status'],
    providerUrl: row.provider_url ? String(row.provider_url) : null,
    lastError: row.last_error ? String(row.last_error) : null,
  }));
}

export async function retrySocialPublication(publicationId: string) {
  const result = await supabase.rpc('retry_social_publication', {
    target_publication_id: publicationId,
  });
  if (result.error) throw result.error;
}
