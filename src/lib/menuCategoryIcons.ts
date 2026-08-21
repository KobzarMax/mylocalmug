export const MENU_CATEGORY_ICON_KEYS = [
  'coffee',
  'tea',
  'cold_drink',
  'alcoholic_drink',
  'breakfast',
  'sandwich',
  'bakery',
  'dessert',
  'meal',
  'pizza',
  'healthy',
  'ice_cream',
  'other',
] as const;

export type MenuCategoryIconKey = (typeof MENU_CATEGORY_ICON_KEYS)[number];

export const MENU_CATEGORY_ICONS: readonly { key: MenuCategoryIconKey; label: string }[] = [
  { key: 'coffee', label: 'Coffee' },
  { key: 'tea', label: 'Tea' },
  { key: 'cold_drink', label: 'Cold drink' },
  { key: 'alcoholic_drink', label: 'Alcoholic drink' },
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'sandwich', label: 'Sandwich' },
  { key: 'bakery', label: 'Bakery or pastry' },
  { key: 'dessert', label: 'Cake or dessert' },
  { key: 'meal', label: 'Meal' },
  { key: 'pizza', label: 'Pizza' },
  { key: 'healthy', label: 'Healthy or fruit' },
  { key: 'ice_cream', label: 'Ice cream' },
  { key: 'other', label: 'Other' },
];

export function isMenuCategoryIconKey(value: unknown): value is MenuCategoryIconKey {
  return typeof value === 'string' && MENU_CATEGORY_ICON_KEYS.includes(value as MenuCategoryIconKey);
}

export function getMenuCategoryIconLabel(key: MenuCategoryIconKey) {
  return MENU_CATEGORY_ICONS.find((entry) => entry.key === key)?.label ?? 'Other';
}
