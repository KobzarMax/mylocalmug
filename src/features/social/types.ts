export const socialLinkPlatforms = ['instagram', 'facebook', 'tiktok', 'x', 'youtube', 'threads'] as const;
export type SocialLinkPlatform = (typeof socialLinkPlatforms)[number];
export type SocialPlatform = 'facebook' | 'instagram';
export type SocialLinks = Record<SocialLinkPlatform, string>;
export type SocialConnectionStatus = 'connecting' | 'ready' | 'expired' | 'revoked' | 'disabled';
export type SocialPublicationType = 'initial' | 'update' | 'cancellation';
export type SocialPublicationStatus =
  'queued' | 'publishing' | 'published' | 'blocked' | 'failed' | 'needs_review' | 'cancelled';

export type SocialConnection = {
  id: string;
  provider: SocialPlatform;
  accountName: string;
  username: string | null;
  profileUrl: string;
  status: SocialConnectionStatus;
  tokenExpiresAt: string | null;
  lastVerifiedAt: string | null;
};
export type SocialAccountCandidate = {
  id: string;
  name: string;
  username: string | null;
  profileUrl: string;
};

export type SocialPublication = {
  id: string;
  postId: string;
  provider: SocialPlatform;
  publicationType: SocialPublicationType;
  caption: string;
  dueAt: string;
  status: SocialPublicationStatus;
  providerUrl: string | null;
  lastError: string | null;
};

export type SocialComposerInput = {
  providers: SocialPlatform[];
  captions: Partial<Record<SocialPlatform, string>>;
  publicationType: SocialPublicationType;
};
export type SocialFollowUpInput = {
  providers: SocialPlatform[];
  captions: Partial<Record<SocialPlatform, string>>;
  contentUrl: string;
};

export type SocialPublicationPreview = {
  provider: SocialPlatform;
  caption: string;
  requiresCover: boolean;
  available: boolean;
  unavailableReason: string | null;
};

export const emptySocialLinks = (): SocialLinks => ({
  instagram: '',
  facebook: '',
  tiktok: '',
  x: '',
  youtube: '',
  threads: '',
});
