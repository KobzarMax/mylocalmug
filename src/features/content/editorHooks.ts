import { useState } from 'react';

import { createSocialMediaSnapshot, queueSocialPublications } from '../social/api';
import { useSocialConnections } from '../social/hooks';
import { SocialPlatform } from '../social/types';
import { buildSocialCaption, isJpegPath, socialCaptionSchema } from '../social/validation';

import { deleteDraft, publishContent, saveContentDraft } from './api';
import { chooseContentCover, removeContentCover, uploadContentCover } from './media';
import { ContentCover, ContentEditorInput, ContentItem, emptyDocument } from './types';
import { normalizeContentInput } from './validation';

type SaveMode = 'draft' | 'publish' | 'schedule';

export function useContentEditor(options: {
  businessId: string;
  businessAddress: string;
  businessTimezone: string;
  item: ContentItem | null;
  initialKind?: ContentEditorInput['kind'];
  onSaved: () => void;
}) {
  const { businessId, businessAddress, businessTimezone, item, onSaved } = options;
  const [form, setForm] = useState<ContentEditorInput>(() =>
    initialForm(item, businessAddress, businessTimezone, options.initialKind),
  );
  const [cover, setCover] = useState<ContentCover | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const social = useSocialConnections(businessId);
  const [socialProviders, setSocialProviders] = useState<SocialPlatform[]>([]);
  const [socialCaptions, setSocialCaptions] = useState<Partial<Record<SocialPlatform, string>>>({});
  const publicAppUrl = (process.env.EXPO_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  const previewUrl = `${publicAppUrl}/content/${item?.id ?? 'published-story'}`;
  const defaultSocialCaption = publicAppUrl ? buildSocialCaption({ ...form, contentUrl: previewUrl }) : '';

  const update = <Key extends keyof ContentEditorInput>(key: Key, value: ContentEditorInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const setKind = (kind: ContentEditorInput['kind']) =>
    setForm((current) => {
      if (kind === 'news')
        return {
          ...current,
          kind,
          eventStartsAt: null,
          eventEndsAt: null,
          eventAllDay: false,
          eventTimezone: null,
          eventVenueName: null,
          eventVenueAddress: null,
          reminderMinutes: [],
        };
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setMinutes(0, 0, 0);
      return {
        ...current,
        kind,
        eventStartsAt: current.eventStartsAt ?? start.toISOString(),
        eventTimezone: current.eventTimezone ?? businessTimezone,
        eventVenueAddress: current.eventVenueAddress ?? (businessAddress || null),
        reminderMinutes: current.reminderMinutes.length ? current.reminderMinutes : [1440, 60],
      };
    });
  const pickCover = async () => {
    const selected = await chooseContentCover();
    if (selected) {
      setCover(selected);
      setCoverRemoved(false);
    }
  };
  const clearCover = () => {
    setCover(null);
    setCoverRemoved(true);
  };

  const submit = async (mode: SaveMode, scheduledFor?: Date) => {
    const input = normalizeContentInput(form);
    if (mode === 'schedule' && !scheduledFor) throw new Error('Choose a publication date and time.');
    if (
      mode !== 'draft' &&
      input.kind === 'event' &&
      input.eventStartsAt &&
      new Date(input.eventStartsAt) <= (scheduledFor ?? new Date())
    ) {
      throw new Error('Publish the event before it starts.');
    }

    setBusy(true);
    const existingPath = item?.coverPath ?? null;
    let postId = item?.id ?? null;
    let uploadedPath: string | null = null;
    let createdDraft = false;
    try {
      if (!postId) {
        postId = await saveContentDraft(businessId, null, input, null);
        createdDraft = true;
      }
      if (cover) uploadedPath = await uploadContentCover(businessId, postId, cover);
      const nextPath = uploadedPath ?? (coverRemoved ? null : existingPath);
      await saveContentDraft(businessId, postId, input, nextPath);
      let publicationTime: Date | null = null;
      if (mode !== 'draft') {
        publicationTime = mode === 'publish' ? new Date() : (scheduledFor as Date);
        await publishContent(postId, publicationTime.toISOString());
      }
      if (socialProviders.length && (mode !== 'draft' || item?.publishedAt)) {
        const existingPublished = Boolean(item?.publishedAt && new Date(item.publishedAt) <= new Date());
        const dueAt = publicationTime ?? (existingPublished ? new Date() : new Date(item?.publishedAt ?? 0));
        if (!Number.isFinite(dueAt.getTime())) throw new Error('Choose a Local Mug publication time first.');
        let socialMediaPath: string | null = null;
        if (socialProviders.includes('instagram')) {
          if (!nextPath || !isJpegPath(nextPath)) throw new Error('Instagram requires a JPEG cover image.');
          socialMediaPath = await createSocialMediaSnapshot(businessId, postId, nextPath);
        }
        const contentUrl = `${publicAppUrl}/content/${postId}`;
        const captions = Object.fromEntries(
          socialProviders.map((provider) => [
            provider,
            socialCaptionSchema.parse(
              socialCaptions[provider] ?? buildSocialCaption({ ...input, contentUrl }),
            ),
          ]),
        );
        await queueSocialPublications({
          businessId,
          postId,
          publicationType: existingPublished ? 'update' : 'initial',
          dueAt: dueAt.toISOString(),
          contentUrl,
          captions,
          mediaPath: socialMediaPath,
        });
      }
      if (existingPath && existingPath !== nextPath) {
        await removeContentCover(businessId, postId, existingPath).catch(() => undefined);
      }
      onSaved();
    } catch (caught) {
      if (uploadedPath && postId)
        await removeContentCover(businessId, postId, uploadedPath).catch(() => undefined);
      if (createdDraft && postId) await deleteDraft(postId).catch(() => undefined);
      throw caught;
    } finally {
      setBusy(false);
    }
  };

  return {
    form,
    update,
    setKind,
    busy,
    pickCover,
    clearCover,
    submit,
    coverUrl: cover?.uri ?? (coverRemoved ? null : (item?.coverUrl ?? null)),
    kindLocked: Boolean(item?.publishedAt),
    socialConnections: social.connections,
    socialProviders,
    socialCaptions,
    defaultSocialCaption,
    publicSocialUrlReady: /^https:\/\//.test(publicAppUrl),
    hasJpegCover: cover
      ? cover.mimeType === 'image/jpeg'
      : isJpegPath(coverRemoved ? null : (item?.coverPath ?? null)),
    toggleSocialProvider: (provider: SocialPlatform) =>
      setSocialProviders((current) =>
        current.includes(provider) ? current.filter((value) => value !== provider) : [...current, provider],
      ),
    updateSocialCaption: (provider: SocialPlatform, value: string) =>
      setSocialCaptions((current) => ({ ...current, [provider]: value })),
  };
}

function initialForm(
  item: ContentItem | null,
  businessAddress: string,
  businessTimezone: string,
  initialKind: ContentEditorInput['kind'] = 'news',
): ContentEditorInput {
  if (item)
    return {
      kind: item.kind,
      title: item.title,
      excerpt: item.excerpt,
      bodyDocument: item.bodyDocument,
      bodyText: item.bodyText,
      isPinned: item.isPinned,
      eventStartsAt: item.eventStartsAt,
      eventEndsAt: item.eventEndsAt,
      eventAllDay: item.eventAllDay,
      eventTimezone: item.eventTimezone,
      eventVenueName: item.eventVenueName,
      eventVenueAddress: item.eventVenueAddress,
      reminderMinutes: item.reminderMinutes,
    };
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setMinutes(0, 0, 0);
  return {
    kind: initialKind,
    title: '',
    excerpt: '',
    bodyDocument: emptyDocument(),
    bodyText: '',
    isPinned: false,
    eventStartsAt: initialKind === 'event' ? start.toISOString() : null,
    eventEndsAt: null,
    eventAllDay: false,
    eventTimezone: initialKind === 'event' ? businessTimezone : null,
    eventVenueName: null,
    eventVenueAddress: initialKind === 'event' ? businessAddress || null : null,
    reminderMinutes: initialKind === 'event' ? [1440, 60] : [],
  };
}
