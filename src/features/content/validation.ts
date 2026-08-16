import { z } from 'zod';

import { ContentEditorInput, EventReminderOffset, RichTextDocument } from './types';

const allowedNodeTypes = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'hardBreak',
  'codeBlock',
]);
const allowedMarkTypes = new Set(['bold', 'italic', 'strike', 'underline', 'link', 'code']);
const reminderOffsets = [60, 1440, 10080] as const;

const richTextSchema = z.custom<RichTextDocument>((value) => {
  if (!value || typeof value !== 'object') return false;
  const document = value as RichTextDocument;
  if (document.type !== 'doc' || !Array.isArray(document.content)) return false;
  if (JSON.stringify(document).length > 100_000) return false;
  return validateNodes(document.content, 0);
}, 'The article body contains unsupported formatting.');

export const contentEditorSchema = z
  .object({
    kind: z.enum(['news', 'event']),
    title: z.string().trim().min(3, 'Enter a title of at least 3 characters.').max(140),
    excerpt: z.string().trim().min(1, 'Add a short excerpt.').max(300),
    bodyDocument: richTextSchema,
    bodyText: z.string().trim().min(1, 'Write the article body.').max(50_000),
    isPinned: z.boolean(),
    eventStartsAt: z.string().datetime().nullable(),
    eventEndsAt: z.string().datetime().nullable(),
    eventAllDay: z.boolean(),
    eventTimezone: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .refine(isValidTimeZone, 'Enter a valid IANA timezone.')
      .nullable(),
    eventVenueName: z.string().trim().max(120).nullable(),
    eventVenueAddress: z.string().trim().max(300).nullable(),
    reminderMinutes: z.array(z.union([z.literal(60), z.literal(1440), z.literal(10080)])).max(3),
  })
  .superRefine((value, context) => {
    if (value.kind === 'news') {
      if (value.eventStartsAt || value.eventEndsAt || value.reminderMinutes.length) {
        context.addIssue({ code: 'custom', message: 'News cannot contain event dates or reminders.' });
      }
      return;
    }
    if (!value.eventStartsAt || !value.eventTimezone) {
      context.addIssue({ code: 'custom', message: 'Choose an event start date and timezone.' });
      return;
    }
    if (value.eventEndsAt && new Date(value.eventEndsAt) <= new Date(value.eventStartsAt)) {
      context.addIssue({ code: 'custom', message: 'Event end must be after its start.' });
    }
    if (value.eventAllDay) {
      const boundaries = [value.eventStartsAt, value.eventEndsAt].filter(Boolean) as string[];
      if (boundaries.some((boundary) => !boundary.endsWith('T00:00:00.000Z'))) {
        context.addIssue({
          code: 'custom',
          message: 'All-day events must use whole calendar-day boundaries.',
        });
      }
    }
  });

export const publicationTimeSchema = z
  .string()
  .datetime()
  .refine(
    (value) => new Date(value).getTime() >= Date.now() - 60_000,
    'Publication time cannot be in the past.',
  );

export const cancellationReasonSchema = z.string().trim().min(3).max(300);

export function normalizeContentInput(input: ContentEditorInput): ContentEditorInput {
  const normalized = {
    ...input,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    bodyText: input.bodyText.trim(),
    eventTimezone: trimNullable(input.eventTimezone),
    eventVenueName: trimNullable(input.eventVenueName),
    eventVenueAddress: trimNullable(input.eventVenueAddress),
    reminderMinutes: [...new Set(input.reminderMinutes)].sort((a, b) => b - a) as EventReminderOffset[],
  };
  return contentEditorSchema.parse(normalized);
}

function trimNullable(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed || null;
}

function validateNodes(nodes: unknown[], depth: number): boolean {
  if (depth > 20 || nodes.length > 2_000) return false;
  return nodes.every((candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const node = candidate as Record<string, unknown>;
    if (typeof node.type !== 'string' || !allowedNodeTypes.has(node.type)) return false;
    if (node.text !== undefined && typeof node.text !== 'string') return false;
    if (Array.isArray(node.marks) && !node.marks.every((mark) => validateMark(mark))) return false;
    return (
      node.content === undefined || (Array.isArray(node.content) && validateNodes(node.content, depth + 1))
    );
  });
}

function validateMark(candidate: unknown): boolean {
  if (!candidate || typeof candidate !== 'object') return false;
  const mark = candidate as { type?: unknown; attrs?: { href?: unknown } };
  if (typeof mark.type !== 'string' || !allowedMarkTypes.has(mark.type)) return false;
  if (mark.type !== 'link') return true;
  const href = mark.attrs?.href;
  return typeof href === 'string' && /^(https?:|mailto:)/i.test(href);
}

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const REMINDER_OPTIONS: { value: EventReminderOffset; label: string }[] = reminderOffsets
  .slice()
  .reverse()
  .map((value) => ({
    value,
    label: value === 60 ? '1 hour' : value === 1440 ? '1 day' : '1 week',
  }));
