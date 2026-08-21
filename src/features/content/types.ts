import { ProfileImageMime } from '../../lib/profileValidation';
import { BusinessBrandPalette } from '../branding/types';

export type ContentKind = 'news' | 'event';
export type PublicationState = 'draft' | 'scheduled' | 'published' | 'archived';
export type EventState = 'scheduled' | 'cancelled';
export type EventReminderOffset = 10080 | 1440 | 60;
export type ContentFilter = 'all' | ContentKind | PublicationState | 'cancelled';
export type FeedFilter = 'all' | ContentKind;

export type RichTextNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichTextNode[];
};

export type RichTextDocument = {
  type: 'doc';
  content: RichTextNode[];
};

export type ContentEditorInput = {
  kind: ContentKind;
  title: string;
  excerpt: string;
  bodyDocument: RichTextDocument;
  bodyText: string;
  isPinned: boolean;
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  eventAllDay: boolean;
  eventTimezone: string | null;
  eventVenueName: string | null;
  eventVenueAddress: string | null;
  reminderMinutes: EventReminderOffset[];
};

export type ContentItem = ContentEditorInput & {
  id: string;
  businessId: string;
  businessName: string;
  businessLogoUrl: string | null;
  brandPalette: BusinessBrandPalette;
  coverPath: string | null;
  coverUrl: string | null;
  authorDisplayName: string;
  eventCancelledAt: string | null;
  eventCancellationReason: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentSummary = Omit<ContentItem, 'bodyDocument' | 'bodyText'> & {
  readingMinutes: number;
};
export type ContentDetail = ContentItem & { readingMinutes: number };
export type ContentCursor = {
  pinned: boolean;
  publishedAt: string;
  id: string;
};

export type ContentPage = {
  items: ContentSummary[];
  nextCursor: ContentCursor | null;
};

export type ContentCover = { uri: string; mimeType: ProfileImageMime };
export type FollowState = { following: boolean; eventNotificationsEnabled: boolean };
export type PushDeviceRegistration = { token: string; platform: 'ios' | 'android' };

export const emptyDocument = (): RichTextDocument => ({ type: 'doc', content: [] });

export const publicationStateOf = (
  item: Pick<ContentItem, 'publishedAt' | 'archivedAt'>,
): PublicationState => {
  if (item.archivedAt) return 'archived';
  if (!item.publishedAt) return 'draft';
  return new Date(item.publishedAt).getTime() > Date.now() ? 'scheduled' : 'published';
};
