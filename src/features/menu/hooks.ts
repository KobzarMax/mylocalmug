import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { safeErrorMessage } from '../../lib/errors';
import {
  inferProfileImageMime,
  validateProfileImageBytes,
  validateProfileImageMetadata,
} from '../../lib/profileImage';

import {
  addDefaultMenuCategories,
  deleteMenuItem,
  getBusinessMenu,
  removeMenuPhoto,
  saveMenuItem,
  uploadMenuPhoto,
} from './api';
import { menuKeys } from './queryKeys';
import { MenuCategory, MenuItem, MenuPhoto } from './types';
import { menuItemInputSchema } from './validation';

export function useMenu(businessId: string) {
  const queryKey = menuKeys.business(businessId);
  const client = useQueryClient();
  const query = useQuery({ queryKey, queryFn: () => getBusinessMenu(businessId), meta: { persist: false } });
  const mutation = useMutation({
    mutationFn: (action: () => Promise<void>) => action(),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const runMutation = async (action: () => Promise<void>) => {
    try {
      await mutation.mutateAsync(action);
    } catch (caught) {
      const message = messageFrom(caught, 'Could not update the menu.');
      throw new Error(message);
    }
  };

  const categories = query.data?.categories ?? [];
  const items = query.data?.items ?? [];

  const addDefaults = () => runMutation(() => addDefaultMenuCategories(businessId));

  const removeItem = (item: MenuItem) =>
    runMutation(async () => {
      await deleteMenuItem(businessId, item.id);
      await removeMenuPhoto(businessId, item.photoUrl).catch(() => undefined);
    });

  return {
    categories,
    items,
    loading: query.isLoading,
    busy: mutation.isPending,
    error: query.error
      ? messageFrom(query.error, 'Could not load the menu.')
      : mutation.error
        ? messageFrom(mutation.error, 'Could not update the menu.')
        : null,
    refresh: () => client.invalidateQueries({ queryKey }),
    addDefaults,
    removeItem,
  };
}

export function useMenuItemEditor(
  businessId: string,
  item: MenuItem | null,
  categories: MenuCategory[],
  onSaved: () => void,
) {
  const [form, setForm] = useState<MenuItemFormState>({
    categoryId: item ? item.categoryId : (categories[0]?.id ?? null),
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item ? item.price.toFixed(2) : '',
    isAvailable: item?.isAvailable ?? true,
  });
  const [photo, setPhoto] = useState<MenuPhoto | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const pickPhoto = async () => {
    const selected = await chooseMenuPhoto();
    if (!selected) return;
    setPhoto(selected);
    setPhotoRemoved(false);
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoRemoved(true);
  };

  const submit = async () => {
    const parsed = menuItemInputSchema.safeParse(form);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Menu item details are invalid.');
    if (parsed.data.categoryId && !categories.some((category) => category.id === parsed.data.categoryId)) {
      throw new Error('Choose a category from this business.');
    }

    setBusy(true);
    let uploaded: { path: string; url: string } | null = null;
    const previousPhotoUrl = item?.photoUrl ?? null;
    try {
      if (photo) uploaded = await uploadMenuPhoto(businessId, photo);
      const nextPhotoUrl = uploaded?.url ?? (photoRemoved ? null : previousPhotoUrl);
      await saveMenuItem(businessId, item?.id ?? null, parsed.data, nextPhotoUrl);
      if (previousPhotoUrl && previousPhotoUrl !== nextPhotoUrl) {
        await removeMenuPhoto(businessId, previousPhotoUrl).catch(() => undefined);
      }
      onSaved();
    } catch (caught) {
      if (uploaded) await removeMenuPhoto(businessId, uploaded.path).catch(() => undefined);
      throw caught;
    } finally {
      setBusy(false);
    }
  };

  const previewUrl = photo?.uri ?? (photoRemoved ? null : (item?.photoUrl ?? null));
  return { form, update, previewUrl, busy, pickPhoto, clearPhoto, submit };
}

type MenuItemFormState = {
  categoryId: string | null;
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
};

async function chooseMenuPhoto(): Promise<MenuPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
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
  return { uri: asset.uri, mimeType };
}

function messageFrom(caught: unknown, fallback: string) {
  return safeErrorMessage(caught, fallback);
}
