import { supabase } from '../../lib/supabase';

import { MenuCategory, MenuData, MenuItem, MenuPhoto } from './types';
import { MenuCategoryInput, MenuItemInput } from './validation';

const menuMediaBucket = 'menu-media';

export async function getBusinessMenu(businessId: string): Promise<MenuData> {
  const [categoriesResult, itemsResult] = await Promise.all([
    supabase
      .from('menu_categories')
      .select('id, business_id, name, sort_order')
      .eq('business_id', businessId)
      .order('sort_order')
      .order('name'),
    supabase
      .from('menu_items')
      .select('id, business_id, category_id, name, description, price, photo_url, is_available, created_at')
      .eq('business_id', businessId)
      .order('created_at'),
  ]);
  if (categoriesResult.error) throw categoriesResult.error;
  if (itemsResult.error) throw itemsResult.error;
  return {
    categories: (categoriesResult.data ?? []).map(mapCategory),
    items: (itemsResult.data ?? []).map(mapItem),
  };
}

export async function saveMenuCategory(
  businessId: string,
  categoryId: string | null,
  input: MenuCategoryInput,
  sortOrder: number,
) {
  const payload = { business_id: businessId, name: input.name, sort_order: sortOrder };
  const result = categoryId
    ? await supabase
        .from('menu_categories')
        .update(payload)
        .eq('id', categoryId)
        .eq('business_id', businessId)
    : await supabase.from('menu_categories').insert(payload);
  if (result.error) throw result.error;
}

export async function saveMenuCategoryOrder(categories: MenuCategory[]) {
  if (categories.length === 0) return;
  const result = await supabase.from('menu_categories').upsert(
    categories.map((category, index) => ({
      id: category.id,
      business_id: category.businessId,
      name: category.name,
      sort_order: index,
    })),
  );
  if (result.error) throw result.error;
}

export async function deleteMenuCategory(businessId: string, categoryId: string) {
  const result = await supabase.rpc('delete_menu_category', {
    target_business_id: businessId,
    target_category_id: categoryId,
  });
  if (result.error) throw result.error;
}

export async function addDefaultMenuCategories(businessId: string) {
  const result = await supabase.rpc('add_default_menu_categories', {
    target_business_id: businessId,
  });
  if (result.error) throw result.error;
}

export async function saveMenuItem(
  businessId: string,
  itemId: string | null,
  input: MenuItemInput,
  photoUrl: string | null,
) {
  const payload = {
    business_id: businessId,
    category_id: input.categoryId,
    name: input.name,
    description: input.description,
    price: Number(input.price),
    photo_url: photoUrl,
    is_available: input.isAvailable,
  };
  const result = itemId
    ? await supabase.from('menu_items').update(payload).eq('id', itemId).eq('business_id', businessId)
    : await supabase.from('menu_items').insert(payload);
  if (result.error) throw result.error;
}

export async function deleteMenuItem(businessId: string, itemId: string) {
  const result = await supabase.from('menu_items').delete().eq('business_id', businessId).eq('id', itemId);
  if (result.error) throw result.error;
}

export async function uploadMenuPhoto(businessId: string, photo: MenuPhoto) {
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[photo.mimeType];
  const path = `${businessId}/items/item-${Date.now()}.${extension}`;
  const response = await fetch(photo.uri);
  const bytes = await response.arrayBuffer();
  const result = await supabase.storage.from(menuMediaBucket).upload(path, bytes, {
    contentType: photo.mimeType,
  });
  if (result.error) throw result.error;
  return { path, url: supabase.storage.from(menuMediaBucket).getPublicUrl(path).data.publicUrl };
}

export async function removeMenuPhoto(businessId: string, photoPathOrUrl: string | null) {
  if (!photoPathOrUrl) return;
  const path = getOwnedMenuPhotoPath(businessId, photoPathOrUrl);
  if (!path) return;
  const result = await supabase.storage.from(menuMediaBucket).remove([path]);
  if (result.error) throw result.error;
}

function getOwnedMenuPhotoPath(businessId: string, pathOrUrl: string) {
  const marker = `/storage/v1/object/public/${menuMediaBucket}/`;
  const markerIndex = pathOrUrl.indexOf(marker);
  const encodedPath = markerIndex >= 0 ? pathOrUrl.slice(markerIndex + marker.length) : pathOrUrl;
  let path: string;
  try {
    path = decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
  return path.startsWith(`${businessId}/items/`) ? path : null;
}

type MenuCategoryRow = {
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
};

type MenuItemRow = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: string | number;
  photo_url: string | null;
  is_available: boolean;
  created_at: string;
};

function mapCategory(row: MenuCategoryRow): MenuCategory {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

function mapItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    businessId: row.business_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    photoUrl: row.photo_url,
    isAvailable: row.is_available,
    createdAt: row.created_at,
  };
}
