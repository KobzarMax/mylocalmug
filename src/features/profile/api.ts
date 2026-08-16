import { toAppError } from '../../lib/errors';
import {
  createAvatarPath,
  PROFILE_IMAGE_BUCKET,
  validateProfileImageBytes,
  validateProfileImageMetadata,
} from '../../lib/profileImage';
import { ProfileUpdateInput } from '../../lib/profileValidation';
import { supabase } from '../../lib/supabase';

import { CoffeeSpot, EditableProfile, SelectedProfileImage } from './types';

export async function getProfileCoffeeSpots(profileId: string) {
  const [businesses, favorites] = await Promise.all([
    supabase.from('businesses').select('id, name, address, logo_url').eq('is_published', true).order('name'),
    supabase.from('favorite_businesses').select('business_id').eq('profile_id', profileId),
  ]);
  if (businesses.error || favorites.error) {
    throw toAppError(businesses.error ?? favorites.error, 'Coffee spots could not be loaded.');
  }
  return {
    spots: (businesses.data ?? []) as CoffeeSpot[],
    favoriteIds: (favorites.data ?? []).map((row) => row.business_id as string),
  };
}

export async function saveProfile(
  current: EditableProfile,
  input: ProfileUpdateInput,
  selectedImage: SelectedProfileImage | null,
) {
  let uploadedPath: string | null = null;
  try {
    let avatarPath = current.avatar_path;
    if (selectedImage) {
      const bytes = await (await fetch(selectedImage.uri)).arrayBuffer();
      validateProfileImageMetadata(selectedImage.mimeType, bytes.byteLength);
      validateProfileImageBytes(bytes, selectedImage.mimeType);
      uploadedPath = createAvatarPath(current.id, selectedImage.mimeType);
      const upload = await supabase.storage.from(PROFILE_IMAGE_BUCKET).upload(uploadedPath, bytes, {
        contentType: selectedImage.mimeType,
        upsert: false,
      });
      if (upload.error) throw upload.error;
      avatarPath = uploadedPath;
    }

    const result = await supabase
      .from('profiles')
      .update({
        display_name: input.displayName,
        description: input.description,
        avatar_path: avatarPath,
      })
      .eq('id', current.id)
      .select('id, role, display_name, description, avatar_path')
      .single();
    if (result.error) throw result.error;

    const metadata = await supabase.auth.updateUser({ data: { display_name: input.displayName } });
    if (metadata.error) console.warn('Profile saved, but Auth display-name metadata was not updated.');
    if (uploadedPath && current.avatar_path && uploadedPath !== current.avatar_path) {
      await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([current.avatar_path]);
    }
    return result.data as EditableProfile;
  } catch (error) {
    if (uploadedPath) await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([uploadedPath]);
    throw toAppError(error, 'Your profile could not be saved. Please try again.');
  }
}

export async function requestEmailChange(nextEmail: string) {
  const result = await supabase.auth.updateUser({ email: nextEmail });
  if (result.error) throw toAppError(result.error, 'The email change could not be requested.');
}

export async function changePassword(email: string, currentPassword: string, nextPassword: string) {
  const reauthentication = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (reauthentication.error) throw toAppError(reauthentication.error, 'The current password is incorrect.');
  const result = await supabase.auth.updateUser({ password: nextPassword });
  if (result.error) throw toAppError(result.error, 'The password could not be changed.');
}

export async function setFavorite(profileId: string, businessId: string, favorite: boolean) {
  const result = favorite
    ? await supabase.from('favorite_businesses').insert({ profile_id: profileId, business_id: businessId })
    : await supabase
        .from('favorite_businesses')
        .delete()
        .eq('profile_id', profileId)
        .eq('business_id', businessId);
  if (result.error) throw toAppError(result.error, 'Your favourites could not be updated.');
}
