import { z } from 'zod';

import { SocialLinkPlatform, SocialLinks, socialLinkPlatforms } from './types';

const hosts: Record<SocialLinkPlatform, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
  threads: ['threads.net', 'www.threads.net'],
};

export const socialCaptionSchema = z.string().trim().min(1, 'Write a social caption.').max(2000);

export function normalizeSocialUrl(platform: SocialLinkPlatform, raw: string) {
  const value = raw.trim();
  if (!value) return '';
  if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https?:\/\//i.test(value))
    throw new Error(`Use an HTTPS ${label(platform)} profile URL.`);
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`Enter a valid ${label(platform)} profile URL.`);
  }
  if (parsed.protocol !== 'https:' || !hosts[platform].includes(parsed.hostname.toLowerCase()))
    throw new Error(`Use an HTTPS ${label(platform)} profile URL.`);
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

export function normalizeSocialLinks(value: Partial<Record<SocialLinkPlatform, string>>): SocialLinks {
  return Object.fromEntries(
    socialLinkPlatforms.map((platform) => [platform, normalizeSocialUrl(platform, value[platform] ?? '')]),
  ) as SocialLinks;
}

export function parseStoredSocialLinks(value: unknown): SocialLinks {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  try {
    return normalizeSocialLinks(source as Partial<Record<SocialLinkPlatform, string>>);
  } catch {
    return Object.fromEntries(socialLinkPlatforms.map((platform) => [platform, ''])) as SocialLinks;
  }
}

export function buildSocialCaption(input: {
  title: string;
  excerpt: string;
  contentUrl: string;
  eventStartsAt?: string | null;
  eventTimezone?: string | null;
  eventVenueName?: string | null;
}) {
  const parts = [input.title.trim()];
  if (input.eventStartsAt) {
    const date = new Date(input.eventStartsAt);
    parts.push(
      new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: input.eventTimezone ?? 'Europe/London',
      }).format(date),
    );
    if (input.eventVenueName?.trim()) parts.push(input.eventVenueName.trim());
  }
  if (input.excerpt.trim()) parts.push(input.excerpt.trim());
  parts.push(input.contentUrl);
  return socialCaptionSchema.parse(parts.join('\n\n').slice(0, 2000));
}

export function isJpegPath(path: string | null) {
  return Boolean(path && /\.jpe?g$/i.test(path));
}

function label(platform: SocialLinkPlatform) {
  return platform === 'x' ? 'X' : platform[0].toUpperCase() + platform.slice(1);
}
