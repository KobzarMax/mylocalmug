import assert from 'node:assert/strict';
import { contentEditorSchema, normalizeContentInput } from '../src/features/content/validation';
import { ContentEditorInput } from '../src/features/content/types';

const news: ContentEditorInput = {
  kind: 'news',
  title: 'A new seasonal roast',
  excerpt: 'Meet the coffee joining our bar this week.',
  bodyDocument: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Freshly roasted.' }] }] },
  bodyText: 'Freshly roasted.',
  isPinned: false,
  eventStartsAt: null,
  eventEndsAt: null,
  eventAllDay: false,
  eventTimezone: null,
  eventVenueName: null,
  eventVenueAddress: null,
  reminderMinutes: [],
};

assert.equal(contentEditorSchema.safeParse(news).success, true, 'valid news should pass');
assert.equal(contentEditorSchema.safeParse({
  ...news,
  bodyDocument: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Unsafe', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] },
}).success, false, 'unsafe link protocols should fail');

const event: ContentEditorInput = {
  ...news,
  kind: 'event',
  eventStartsAt: '2027-08-20T18:00:00.000Z',
  eventEndsAt: '2027-08-20T20:00:00.000Z',
  eventTimezone: 'Europe/London',
  eventVenueName: 'Local Mug',
  eventVenueAddress: '1 Coffee Street',
  reminderMinutes: [60, 1440, 60],
};
assert.deepEqual(normalizeContentInput(event).reminderMinutes, [1440, 60], 'reminders should be unique and ordered');
assert.equal(contentEditorSchema.safeParse({ ...event, eventEndsAt: '2027-08-20T17:00:00.000Z' }).success, false, 'event end before start should fail');
assert.equal(contentEditorSchema.safeParse({ ...event, eventTimezone: 'Not/A_Timezone' }).success, false, 'invalid IANA timezone should fail');

console.log('Content validation tests passed.');

