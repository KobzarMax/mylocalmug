import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';

import { AppError } from '../../lib/errors';
import {
  getProfileAvatarUrl,
  inferProfileImageMime,
  validateProfileImageBytes,
  validateProfileImageMetadata,
} from '../../lib/profileImage';
import {
  profileEmailSchema,
  profilePasswordSchema,
  profileUpdateInputSchema,
} from '../../lib/profileValidation';

import { changePassword, getProfileCoffeeSpots, requestEmailChange, saveProfile, setFavorite } from './api';
import { EditableProfile, ProfileNotice, SelectedProfileImage } from './types';

export const profileKeys = {
  coffeeSpots: (profileId: string) => ['profile', profileId, 'coffee-spots'] as const,
};

export function useProfileEditor({
  profile,
  email,
  onSaved,
}: {
  profile: EditableProfile;
  email: string;
  onSaved: (profile: EditableProfile) => void;
}) {
  const client = useQueryClient();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [description, setDescription] = useState(profile.description);
  const [selectedImage, setSelectedImage] = useState<SelectedProfileImage | null>(null);
  const [nextEmail, setNextEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<ProfileNotice | null>(null);

  const coffeeSpots = useQuery({
    queryKey: profileKeys.coffeeSpots(profile.id),
    queryFn: () => getProfileCoffeeSpots(profile.id),
    meta: { persist: false },
  });
  const avatarUri = useMemo(
    () => selectedImage?.uri ?? getProfileAvatarUrl(profile.avatar_path),
    [profile.avatar_path, selectedImage],
  );

  const profileMutation = useMutation({
    mutationFn: () => {
      const parsed = profileUpdateInputSchema.safeParse({
        displayName,
        description,
        avatarPath: profile.avatar_path,
      });
      if (!parsed.success)
        throw new AppError(parsed.error.issues[0]?.message ?? 'Check your profile details.', 'validation');
      return saveProfile(profile, parsed.data, selectedImage);
    },
    onSuccess: (saved) => {
      setSelectedImage(null);
      setNotice({ tone: 'success', message: 'Your profile changes have been saved.' });
      onSaved(saved);
    },
    onError: (error) => setNotice({ tone: 'error', message: error.message }),
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      const parsed = profileEmailSchema.safeParse(nextEmail);
      if (!parsed.success) throw new AppError('Enter a valid email address.', 'validation');
      if (parsed.data === email.toLowerCase())
        throw new AppError('Enter a different email address.', 'validation');
      await requestEmailChange(parsed.data);
    },
    onSuccess: () =>
      setNotice({ tone: 'success', message: 'Confirm the new address using the email Supabase sent you.' }),
    onError: (error) => setNotice({ tone: 'error', message: error.message }),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const parsed = profilePasswordSchema.safeParse(nextPassword);
      if (!currentPassword) throw new AppError('Enter your current password.', 'validation');
      if (!parsed.success)
        throw new AppError('Use at least 8 characters for the new password.', 'validation');
      if (parsed.data !== confirmPassword)
        throw new AppError('The new passwords do not match.', 'validation');
      await changePassword(email, currentPassword, parsed.data);
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      setNotice({ tone: 'success', message: 'Your new password is active.' });
    },
    onError: (error) => setNotice({ tone: 'error', message: error.message }),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ businessId, favorite }: { businessId: string; favorite: boolean }) =>
      setFavorite(profile.id, businessId, favorite),
    onMutate: async ({ businessId, favorite }) => {
      await client.cancelQueries({ queryKey: profileKeys.coffeeSpots(profile.id) });
      const previous = client.getQueryData<{ spots: unknown[]; favoriteIds: string[] }>(
        profileKeys.coffeeSpots(profile.id),
      );
      client.setQueryData(profileKeys.coffeeSpots(profile.id), (current: typeof previous) =>
        current
          ? {
              ...current,
              favoriteIds: favorite
                ? [...current.favoriteIds, businessId]
                : current.favoriteIds.filter((id) => id !== businessId),
            }
          : current,
      );
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) client.setQueryData(profileKeys.coffeeSpots(profile.id), context.previous);
      setNotice({ tone: 'error', message: error.message });
    },
    onSettled: () => client.invalidateQueries({ queryKey: profileKeys.coffeeSpots(profile.id) }),
  });

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    try {
      const asset = result.assets[0];
      const mimeType = inferProfileImageMime(asset.mimeType, asset.fileName ?? asset.uri);
      if (!mimeType) throw new Error('Choose a JPEG, PNG, or WebP image.');
      const bytes = await (await fetch(asset.uri)).arrayBuffer();
      validateProfileImageMetadata(mimeType, bytes.byteLength);
      validateProfileImageBytes(bytes, mimeType);
      setSelectedImage({ uri: asset.uri, mimeType });
      setNotice(null);
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : 'Choose another image.' });
    }
  };

  return {
    values: { displayName, description, nextEmail, currentPassword, nextPassword, confirmPassword },
    setters: {
      setDisplayName,
      setDescription,
      setNextEmail,
      setCurrentPassword,
      setNextPassword,
      setConfirmPassword,
    },
    avatarUri,
    choosePhoto,
    coffeeSpots,
    notice,
    setNotice,
    saveProfile: () => profileMutation.mutate(),
    profileBusy: profileMutation.isPending,
    requestEmailChange: () => emailMutation.mutate(),
    emailBusy: emailMutation.isPending,
    changePassword: () => passwordMutation.mutate(),
    passwordBusy: passwordMutation.isPending,
    toggleFavorite: (businessId: string) =>
      favoriteMutation.mutate({
        businessId,
        favorite: !(coffeeSpots.data?.favoriteIds.includes(businessId) ?? false),
      }),
  };
}
