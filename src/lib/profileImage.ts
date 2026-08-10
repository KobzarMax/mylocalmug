import {
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
  ProfileImageMime,
} from './profileValidation';

export const PROFILE_IMAGE_BUCKET = 'profile-images';

const extensionByMime: Record<ProfileImageMime, 'jpg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function isAllowedProfileImageMime(value: string | null | undefined): value is ProfileImageMime {
  return PROFILE_IMAGE_MIME_TYPES.includes(value as ProfileImageMime);
}

export function inferProfileImageMime(
  mimeType: string | null | undefined,
  fileNameOrUri: string,
): ProfileImageMime | null {
  if (isAllowedProfileImageMime(mimeType)) return mimeType;

  const normalized = fileNameOrUri.toLowerCase().split('?')[0];
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return null;
}

export function validateProfileImageMetadata(mimeType: string | null | undefined, size: number | undefined) {
  if (!isAllowedProfileImageMime(mimeType)) {
    throw new Error('Choose a JPEG, PNG, or WebP image. SVG and other file types are blocked.');
  }

  if (!size || size <= 0 || size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error('Profile images must be smaller than 5 MB.');
  }

  return mimeType;
}

export function validateProfileImageBytes(bytes: ArrayBuffer, mimeType: ProfileImageMime) {
  const data = new Uint8Array(bytes);
  const isJpeg = data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  const isPng =
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a;
  const isWebp =
    data.length >= 12 &&
    String.fromCharCode(...data.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...data.slice(8, 12)) === 'WEBP';

  const valid =
    (mimeType === 'image/jpeg' && isJpeg) ||
    (mimeType === 'image/png' && isPng) ||
    (mimeType === 'image/webp' && isWebp);

  if (!valid) {
    throw new Error('The selected file content does not match its image type.');
  }
}

export function createAvatarPath(userId: string, mimeType: ProfileImageMime) {
  return `${userId}/avatar-${Date.now()}.${extensionByMime[mimeType]}`;
}

export function getProfileAvatarUrl(path: string | null | undefined) {
  if (!path) return null;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${supabaseUrl}/storage/v1/object/public/${PROFILE_IMAGE_BUCKET}/${encodedPath}`;
}
