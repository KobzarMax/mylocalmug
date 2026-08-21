import { isMenuCategoryIconKey } from '../../lib/menuCategoryIcons';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

import {
  MarketplaceCursor,
  PublicBusinessDetail,
  PublicBusinessPage,
  PublicBusinessSummary,
  PublicMenu,
  PublicMenuCategory,
} from './types';

const pageSize = 20;

export async function getPublicBusinesses(
  search: string,
  cursor: MarketplaceCursor | null,
): Promise<PublicBusinessPage> {
  const result = await supabase.rpc('get_public_business_catalog', {
    search_text: search.trim() || undefined,
    cursor_name: cursor?.name ?? undefined,
    cursor_id: cursor?.id ?? undefined,
    page_size: pageSize,
  });
  if (result.error) throw result.error;
  const items = (result.data ?? []).map(mapSummary);
  const last = items.at(-1);
  return {
    items,
    nextCursor: items.length === pageSize && last ? { name: last.name, id: last.id } : null,
  };
}

export async function getPublicBusinessDetail(businessId: string): Promise<PublicBusinessDetail> {
  const result = await supabase
    .rpc('get_public_business_detail', { target_business_id: businessId })
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) throw new Error('This coffee shop is unavailable.');
  const row = result.data;
  return {
    ...mapSummary(row),
    phone: String(row.phone ?? ''),
    websiteUrl: String(row.website_url ?? ''),
    socialLinks: isStringRecord(row.social_links) ? row.social_links : {},
    timezone: String(row.timezone ?? 'Europe/London'),
    hours: Array.isArray(row.hours) ? (row.hours as PublicBusinessDetail['hours']) : [],
  };
}

export async function getPublicBusinessMenu(businessId: string): Promise<PublicMenu> {
  const result = await supabase.rpc('get_public_business_menu', { target_business_id: businessId });
  if (result.error) throw result.error;
  const categories = new Map<string, PublicMenuCategory>();
  for (const row of result.data ?? []) {
    const categoryId = row.category_id ? String(row.category_id) : 'uncategorized';
    const category = categories.get(categoryId) ?? {
      id: categoryId,
      name: String(row.category_name),
      sortOrder: Number(row.category_sort_order),
      iconKey: isMenuCategoryIconKey(row.category_icon_key) ? row.category_icon_key : 'other',
      items: [],
    };
    if (row.item_id)
      category.items.push({
        id: String(row.item_id),
        name: String(row.item_name),
        description: String(row.item_description ?? ''),
        price: Number(row.item_price),
        photoUrl: row.item_photo_url ? String(row.item_photo_url) : null,
        event: row.event_id
          ? {
              id: String(row.event_id),
              title: String(row.event_title),
              badge: String(row.event_badge),
              message: String(row.event_message),
              availableFrom: String(row.event_available_from),
              availableUntil: String(row.event_available_until),
            }
          : null,
      });
    categories.set(categoryId, category);
  }
  return { categories: [...categories.values()] };
}

type CatalogRow = Database['public']['Functions']['get_public_business_catalog']['Returns'][number];
type DetailRow = Database['public']['Functions']['get_public_business_detail']['Returns'][number];

function mapSummary(row: CatalogRow | DetailRow): PublicBusinessSummary {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    category: String(row.category ?? 'Independent coffee shop'),
    address: String(row.address ?? ''),
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    headerUrl: row.header_url ? String(row.header_url) : null,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    reviewCount: Number(row.review_count ?? 0),
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value as Record<string, unknown>).every((entry) => typeof entry === 'string')
  );
}
