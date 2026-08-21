import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { palette } from '../lib/design';
import { MenuCategoryIconKey } from '../lib/menuCategoryIcons';

const iconNames: Record<MenuCategoryIconKey, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  coffee: 'coffee-outline',
  tea: 'tea-outline',
  cold_drink: 'bottle-soda-outline',
  alcoholic_drink: 'glass-cocktail',
  breakfast: 'food-variant',
  sandwich: 'hamburger',
  bakery: 'food-croissant',
  dessert: 'cake-variant-outline',
  meal: 'silverware-fork-knife',
  pizza: 'pizza',
  healthy: 'food-apple-outline',
  ice_cream: 'ice-cream',
  other: 'food-outline',
};

export function MenuCategoryIcon({
  iconKey,
  size = 25,
  color = palette.green,
}: {
  iconKey: MenuCategoryIconKey;
  size?: number;
  color?: string;
}) {
  return <MaterialCommunityIcons name={iconNames[iconKey]} size={size} color={color} />;
}
