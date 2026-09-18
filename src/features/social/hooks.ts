import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import {
  disconnectSocialConnection,
  getSocialCandidates,
  getSocialConnections,
  getSocialPublications,
  retrySocialPublication,
  selectSocialCandidate,
  startSocialConnection,
} from './api';
import { SocialPlatform } from './types';

export function useSocialConnections(businessId: string, sessionId?: string | null) {
  const query = useQuery({
    queryKey: ['social-connections', businessId],
    queryFn: () => getSocialConnections(businessId),
    meta: { persist: false },
  });
  const candidates = useQuery({
    queryKey: ['social-candidates', businessId, sessionId],
    queryFn: () => getSocialCandidates(businessId, sessionId!),
    enabled: Boolean(sessionId),
    meta: { persist: false },
  });
  const connect = async (provider: SocialPlatform) => {
    const result = await startSocialConnection(businessId, provider);
    const callback = Linking.createURL('/business/social');
    const browserResult = await WebBrowser.openAuthSessionAsync(result.authorizationUrl, callback);
    if (browserResult.type === 'success') await Linking.openURL(browserResult.url);
    await query.refetch();
  };
  const disconnect = async (provider: SocialPlatform) => {
    await disconnectSocialConnection(businessId, provider);
    await query.refetch();
  };
  const selectCandidate = async (candidateId: string) => {
    if (!sessionId) return;
    await selectSocialCandidate(businessId, sessionId, candidateId);
    await query.refetch();
  };
  return {
    connections: query.data ?? [],
    candidates: candidates.data ?? [],
    loading: query.isLoading || candidates.isLoading,
    error: query.error ?? candidates.error,
    connect,
    disconnect,
    selectCandidate,
  };
}

export function useSocialPublications(postId: string | null) {
  const query = useQuery({
    queryKey: ['social-publications', postId],
    queryFn: () => getSocialPublications(postId!),
    enabled: Boolean(postId),
    meta: { persist: false },
  });
  const retry = async (publicationId: string) => {
    await retrySocialPublication(publicationId);
    await query.refetch();
  };
  return { publications: query.data ?? [], loading: query.isLoading, error: query.error, retry };
}
