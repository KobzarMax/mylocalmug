import {
  buildSocialCaption,
  isJpegPath,
  normalizeSocialLinks,
  normalizeSocialUrl,
  socialCaptionSchema,
} from '../validation';

describe('social validation', () => {
  it('normalizes supported HTTPS profile URLs', () => {
    expect(normalizeSocialUrl('instagram', 'instagram.com/localmug/')).toBe('https://instagram.com/localmug');
    expect(normalizeSocialUrl('x', 'https://twitter.com/localmug')).toBe('https://twitter.com/localmug');
    expect(normalizeSocialLinks({ facebook: '' }).facebook).toBe('');
  });

  it('rejects unsafe protocols and mismatched providers', () => {
    expect(() => normalizeSocialUrl('instagram', 'javascript:alert(1)')).toThrow('HTTPS Instagram');
    expect(() => normalizeSocialUrl('facebook', 'https://instagram.com/localmug')).toThrow('Facebook');
  });

  it('builds event captions and enforces the common limit', () => {
    const caption = buildSocialCaption({
      title: 'Coffee tasting',
      excerpt: 'Try our new roast.',
      contentUrl: 'https://localmug.example/content/1',
      eventStartsAt: '2026-08-24T18:00:00Z',
      eventTimezone: 'Europe/London',
      eventVenueName: 'Local Mug',
    });
    expect(caption).toContain('Coffee tasting');
    expect(caption).toContain('Local Mug');
    expect(caption).toContain('https://localmug.example/content/1');
    expect(() => socialCaptionSchema.parse('x'.repeat(2001))).toThrow();
  });

  it('accepts only JPEG social covers', () => {
    expect(isJpegPath('business/social/post/1.jpg')).toBe(true);
    expect(isJpegPath('business/social/post/1.webp')).toBe(false);
  });
});
