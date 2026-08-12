import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { inferProfileImageMime, validateProfileImageBytes, validateProfileImageMetadata } from '../../lib/profileImage';
import {
  deleteMenuCategory,
  deleteMenuItem,
  getBusinessMenu,
  removeMenuPhoto,
  saveMenuCategory,
  saveMenuCategoryOrder,
  saveMenuItem,
  uploadMenuPhoto,
} from './api';
import { CategoryDirection, MenuCategory, MenuItem, MenuPhoto } from './types';
import { menuCategoryInputSchema, menuItemInputSchema } from './validation';

export function useMenu(businessId: string) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const menu = await getBusinessMenu(businessId);
      setCategories(menu.categories);
      setItems(menu.items);
    } catch (caught) {
      setError(messageFrom(caught, 'Could not load the menu.'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { refresh(); }, [refresh]);

  const runMutation = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (caught) {
      const message = messageFrom(caught, 'Could not update the menu.');
      setError(message);
      throw new Error(message);
    } finally {
      setBusy(false);
    }
  };

  const removeCategory = (category: MenuCategory) => runMutation(
    () => deleteMenuCategory(businessId, category.id),
  );

  const moveCategory = (categoryId: string, direction: CategoryDirection) => {
    const currentIndex = categories.findIndex((category) => category.id === categoryId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= categories.length) return Promise.resolve();
    const ordered = [...categories];
    [ordered[currentIndex], ordered[nextIndex]] = [ordered[nextIndex], ordered[currentIndex]];
    return runMutation(() => saveMenuCategoryOrder(ordered));
  };

  const removeItem = (item: MenuItem) => runMutation(async () => {
    await deleteMenuItem(businessId, item.id);
    await removeMenuPhoto(businessId, item.photoUrl).catch(() => undefined);
  });

  return { categories, items, loading, busy, error, refresh, removeCategory, moveCategory, removeItem };
}

export function useMenuCategoryEditor(
  businessId: string,
  category: MenuCategory | null,
  nextSortOrder: number,
  onSaved: () => void,
) {
  const [name, setName] = useState(category?.name ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = menuCategoryInputSchema.safeParse({ name });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Category name is invalid.');
    setBusy(true);
    try {
      await saveMenuCategory(businessId, category?.id ?? null, parsed.data, category?.sortOrder ?? nextSortOrder);
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return { name, setName, busy, submit };
}

export function useMenuItemEditor(
  businessId: string,
  item: MenuItem | null,
  categories: MenuCategory[],
  onSaved: () => void,
) {
  const [form, setForm] = useState<MenuItemFormState>({
    categoryId: item ? item.categoryId : categories[0]?.id ?? null,
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

  const previewUrl = photo?.uri ?? (photoRemoved ? null : item?.photoUrl ?? null);
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

export function useItemsByCategory(items: MenuItem[]) {
  return useMemo(() => {
    const grouped = new Map<string | null, MenuItem[]>();
    items.forEach((item) => grouped.set(item.categoryId, [...(grouped.get(item.categoryId) ?? []), item]));
    return grouped;
  }, [items]);
}

function messageFrom(caught: unknown, fallback: string) {
  return caught instanceof Error && caught.message ? caught.message : fallback;
}
