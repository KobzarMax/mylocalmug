import { supabase } from '../../lib/supabase';
import { Database, Json } from '../../types/database';

import {
  ContentCursor,
  ContentEditorInput,
  ContentItem,
  ContentDetail,
  ContentKind,
  ContentPage,
  FollowState,
} from './types';
import { normalizeContentInput, publicationTimeSchema } from './validation';

const contentSelect =
  'id, business_id, kind, title, excerpt, body_document, body_text, cover_path, author_display_name, event_starts_at, event_ends_at, event_all_day, event_timezone, event_venue_name, event_venue_address, event_cancelled_at, event_cancellation_reason, is_pinned, published_at, archived_at, created_at, updated_at';

export async function getBusinessContent(businessId: string, businessName: string): Promise<ContentItem[]> {
  const postsResult = await supabase
    .from('posts')
    .select(contentSelect)
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false });
  if (postsResult.error) throw postsResult.error;
  const rows = (postsResult.data ?? []) as ContentRow[];
  const reminders = await getReminders(rows.map((row) => row.id));
  const covers = await getSignedCoverUrls(rows.map((row) => row.cover_path));
  return rows.map((row) => mapContent(row, reminders.get(row.id) ?? [], covers, businessName, null));
}

export async function saveContentDraft(
  businessId: string,
  postId: string | null,
  input: ContentEditorInput,
  coverPath: string | null,
) {
  const value = normalizeContentInput(input);
  const result = await supabase.rpc('save_business_content', {
    target_post_id: postId,
    target_business_id: businessId,
    content_kind: value.kind,
    content_title: value.title,
    content_excerpt: value.excerpt,
    content_body_document: JSON.parse(JSON.stringify(value.bodyDocument)) as Json,
    content_body_text: value.bodyText,
    content_cover_path: coverPath,
    content_is_pinned: value.isPinned,
    content_event_starts_at: value.eventStartsAt,
    content_event_ends_at: value.eventEndsAt,
    content_event_all_day: value.eventAllDay,
    content_event_timezone: value.eventTimezone,
    content_event_venue_name: value.eventVenueName,
    content_event_venue_address: value.eventVenueAddress,
    content_reminder_minutes: value.reminderMinutes,
  });
  if (result.error) throw result.error;
  return result.data as string;
}

export async function publishContent(postId: string, publicationTime: string) {
  const parsedTime = publicationTimeSchema.parse(publicationTime);
  const result = await supabase.rpc('set_business_content_publication', {
    target_post_id: postId,
    publication_time: parsedTime,
  });
  if (result.error) throw result.error;
}

export async function archiveContent(postId: string) {
  const result = await supabase.rpc('archive_business_content', { target_post_id: postId });
  if (result.error) throw result.error;
}

export async function deleteDraft(postId: string) {
  const result = await supabase.rpc('delete_business_content_draft', { target_post_id: postId });
  if (result.error) throw result.error;
  return result.data as string | null;
}

export async function cancelEvent(postId: string, reason: string) {
  const result = await supabase.rpc('cancel_business_event', {
    target_post_id: postId,
    cancellation_reason: reason.trim(),
  });
  if (result.error) throw result.error;
}

export async function getPublicContentPage(options: {
  businessId?: string | null;
  postId?: string | null;
  kind?: ContentKind | null;
  followedOnly?: boolean;
  cursor?: ContentCursor | null;
  pageSize?: number;
}): Promise<ContentPage> {
  const result = await supabase.rpc('get_public_content_feed', {
    target_business_id: options.businessId ?? undefined,
    target_post_id: options.postId ?? undefined,
    requested_kind: options.kind ?? undefined,
    followed_only: options.followedOnly ?? false,
    cursor_pinned: options.cursor?.pinned ?? undefined,
    cursor_published_at: options.cursor?.publishedAt ?? undefined,
    cursor_id: options.cursor?.id ?? undefined,
    page_size: options.pageSize ?? 20,
  });
  if (result.error) throw result.error;
  const rows = (result.data ?? []) as PublicContentRow[];
  const covers = await getSignedCoverUrls(rows.map((row) => row.cover_path));
  const items = rows.map((row) => {
    const item = mapContent(
      row,
      row.reminder_minutes ?? [],
      covers,
      row.business_name,
      row.business_logo_url,
    );
    const { bodyDocument: _document, bodyText, ...summary } = item;
    return { ...summary, readingMinutes: readingMinutes(bodyText) };
  });
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length === (options.pageSize ?? 20) && last?.publishedAt
        ? {
            pinned:
              last.isPinned &&
              last.kind === 'event' &&
              Boolean(last.eventStartsAt && new Date(last.eventStartsAt) > new Date()),
            publishedAt: last.publishedAt,
            id: last.id,
          }
        : null,
  };
}

export async function getPublicContentDetail(postId: string): Promise<ContentDetail | null> {
  const result = await supabase.rpc('get_public_content_feed', {
    target_business_id: undefined,
    target_post_id: postId,
    requested_kind: undefined,
    followed_only: false,
    cursor_pinned: undefined,
    cursor_published_at: undefined,
    cursor_id: undefined,
    page_size: 1,
  });
  if (result.error) throw result.error;
  const row = (result.data?.[0] ?? null) as PublicContentRow | null;
  if (!row) return null;
  const covers = await getSignedCoverUrls([row.cover_path]);
  const item = mapContent(row, row.reminder_minutes ?? [], covers, row.business_name, row.business_logo_url);
  return { ...item, readingMinutes: readingMinutes(item.bodyText) };
}

export async function getFollowState(businessId: string): Promise<FollowState> {
  const user = await supabase.auth.getUser();
  if (user.error || !user.data.user) throw user.error ?? new Error('Sign in to view following settings.');
  const result = await supabase
    .from('business_followers')
    .select('event_notifications_enabled')
    .eq('business_id', businessId)
    .eq('client_id', user.data.user.id)
    .maybeSingle();
  if (result.error) throw result.error;
  return {
    following: Boolean(result.data),
    eventNotificationsEnabled: result.data?.event_notifications_enabled ?? false,
  };
}

export async function followBusiness(businessId: string) {
  const user = await supabase.auth.getUser();
  if (user.error || !user.data.user) throw user.error ?? new Error('Sign in to follow this coffee shop.');
  const result = await supabase.from('business_followers').insert({
    business_id: businessId,
    client_id: user.data.user.id,
    event_notifications_enabled: true,
  });
  if (result.error && result.error.code !== '23505') throw result.error;
  if (result.error?.code === '23505') await setBusinessEventAlerts(businessId, true);
}

export async function setBusinessEventAlerts(businessId: string, enabled: boolean) {
  const result = await supabase
    .from('business_followers')
    .update({ event_notifications_enabled: enabled })
    .eq('business_id', businessId);
  if (result.error) throw result.error;
}

export async function unfollowBusiness(businessId: string) {
  const result = await supabase.from('business_followers').delete().eq('business_id', businessId);
  if (result.error) throw result.error;
}

export async function registerPushDevice(token: string, platform: 'ios' | 'android') {
  const result = await supabase.rpc('register_push_device', {
    device_token: token,
    device_platform: platform,
  });
  if (result.error) throw result.error;
}

async function getReminders(postIds: string[]) {
  const grouped = new Map<string, number[]>();
  if (!postIds.length) return grouped;
  const result = await supabase
    .from('post_event_reminders')
    .select('post_id, minutes_before')
    .in('post_id', postIds);
  if (result.error) throw result.error;
  (result.data ?? []).forEach((row) =>
    grouped.set(row.post_id, [...(grouped.get(row.post_id) ?? []), row.minutes_before]),
  );
  return grouped;
}

async function getSignedCoverUrls(paths: (string | null)[]) {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const entries = await Promise.all(
    unique.map(async (path) => {
      if (/^https?:\/\//i.test(path)) return [path, path] as const;
      const result = await supabase.storage.from('content-media').createSignedUrl(path, 3600);
      return [path, result.error ? null : result.data.signedUrl] as const;
    }),
  );
  return new Map(entries);
}

type PostRow = Database['public']['Tables']['posts']['Row'];
type ContentRow = Pick<
  PostRow,
  | 'id'
  | 'business_id'
  | 'kind'
  | 'title'
  | 'excerpt'
  | 'body_document'
  | 'body_text'
  | 'cover_path'
  | 'author_display_name'
  | 'event_starts_at'
  | 'event_ends_at'
  | 'event_all_day'
  | 'event_timezone'
  | 'event_venue_name'
  | 'event_venue_address'
  | 'event_cancelled_at'
  | 'event_cancellation_reason'
  | 'is_pinned'
  | 'published_at'
  | 'archived_at'
  | 'created_at'
  | 'updated_at'
>;
type PublicContentRow = Database['public']['Functions']['get_public_content_feed']['Returns'][number];

function mapContent(
  row: ContentRow,
  reminders: number[],
  covers: Map<string, string | null>,
  businessName: string,
  businessLogoUrl: string | null,
): ContentItem {
  return {
    id: row.id,
    businessId: String(row.business_id),
    businessName,
    businessLogoUrl,
    kind: row.kind as ContentKind,
    title: String(row.title),
    excerpt: String(row.excerpt),
    bodyDocument: row.body_document as ContentItem['bodyDocument'],
    bodyText: String(row.body_text),
    coverPath: row.cover_path,
    coverUrl: row.cover_path ? (covers.get(row.cover_path) ?? null) : null,
    authorDisplayName: String(row.author_display_name),
    eventStartsAt: row.event_starts_at as string | null,
    eventEndsAt: row.event_ends_at as string | null,
    eventAllDay: Boolean(row.event_all_day),
    eventTimezone: row.event_timezone as string | null,
    eventVenueName: row.event_venue_name as string | null,
    eventVenueAddress: row.event_venue_address as string | null,
    eventCancelledAt: row.event_cancelled_at as string | null,
    eventCancellationReason: row.event_cancellation_reason as string | null,
    reminderMinutes: reminders as ContentItem['reminderMinutes'],
    isPinned: Boolean(row.is_pinned),
    publishedAt: row.published_at as string | null,
    archivedAt: row.archived_at as string | null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function readingMinutes(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200));
}
