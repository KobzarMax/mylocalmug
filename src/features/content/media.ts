import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import {
  inferProfileImageMime,
  validateProfileImageBytes,
  validateProfileImageMetadata,
} from '../../lib/profileImage';
import { supabase } from '../../lib/supabase';

import { ContentCover } from './types';

const bucket = 'content-media';

export async function chooseContentCover(): Promise<ContentCover | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.85,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const mimeType = inferProfileImageMime(asset.mimeType, asset.fileName ?? asset.uri);
  if (!mimeType) throw new Error('Choose a JPEG, PNG, or WebP image.');
  const response = await fetch(asset.uri);
  const bytes = await response.arrayBuffer();
  validateProfileImageMetadata(mimeType, bytes.byteLength);
  validateProfileImageBytes(bytes, mimeType);
  const context = ImageManipulator.manipulate(asset.uri);
  const rendered = await context.renderAsync();
  const jpeg = await rendered.saveAsync({ compress: 0.88, format: SaveFormat.JPEG });
  return { uri: jpeg.uri, mimeType: 'image/jpeg' };
}

export async function uploadContentCover(businessId: string, postId: string, cover: ContentCover) {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[cover.mimeType];
  const path = `${businessId}/content/${postId}/cover-${Date.now()}.${extension}`;
  const response = await fetch(cover.uri);
  const bytes = await response.arrayBuffer();
  const result = await supabase.storage.from(bucket).upload(path, bytes, { contentType: cover.mimeType });
  if (result.error) throw result.error;
  return path;
}

export async function removeContentCover(businessId: string, postId: string, path: string | null) {
  if (!path || !path.startsWith(`${businessId}/content/${postId}/`)) return;
  const result = await supabase.storage.from(bucket).remove([path]);
  if (result.error) throw result.error;
}
