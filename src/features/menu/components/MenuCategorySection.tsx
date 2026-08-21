import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { CachedImage } from '../../../components/CachedImage';
import { MenuCategoryIcon } from '../../../components/MenuCategoryIcon';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { MenuCategory, MenuItem } from '../types';

type CategorySectionProps = {
  category?: MenuCategory;
  name?: string;
  items: MenuItem[];
  busy: boolean;
  onItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => void;
};

export function MenuCategorySection(props: CategorySectionProps) {
  return (
    <View>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{props.category?.name ?? props.name}</Text>
        <Text style={styles.categoryCount}>
          {props.items.length} item{props.items.length === 1 ? '' : 's'}
        </Text>
      </View>
      {props.items.length === 0 ? (
        <Text style={styles.emptyText}>No items in this category yet.</Text>
      ) : (
        props.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            iconKey={props.category?.iconKey ?? 'other'}
            disabled={props.busy}
            onPress={() => props.onItem(item)}
            onDelete={() => props.onDeleteItem(item)}
          />
        ))
      )}
    </View>
  );
}

function MenuItemCard({
  item,
  iconKey,
  disabled,
  onPress,
  onDelete,
}: {
  item: MenuItem;
  iconKey: MenuCategory['iconKey'];
  disabled: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.name}`}
      disabled={disabled}
      onPress={onPress}
      style={[styles.itemCard, disabled && styles.disabled]}
    >
      <CachedImage
        uri={item.photoUrl}
        cacheKey={item.photoUrl ?? `business-menu-${item.id}`}
        style={styles.itemPhoto}
        accessibilityLabel={item.name}
        fallback={<MenuCategoryIcon iconKey={iconKey} />}
      />
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
        </View>
        {item.description ? (
          <Text numberOfLines={2} style={styles.itemDescription}>
            {item.description}
          </Text>
        ) : null}
        <View style={[styles.availability, !item.isAvailable && styles.unavailable]}>
          <Text style={styles.availabilityText}>{item.isAvailable ? 'Available' : 'Unavailable'}</Text>
        </View>
      </View>
      <SmallButton
        icon="trash-outline"
        disabled={disabled}
        label={`Delete ${item.name}`}
        danger
        onPress={onDelete}
      />
    </Pressable>
  );
}

function SmallButton({
  icon,
  disabled,
  label,
  danger,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  label: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={(event) => {
        event.stopPropagation();
        onPress?.();
      }}
      style={[styles.compactButton, disabled && styles.iconButtonDisabled]}
    >
      <Ionicons name={icon} size={18} color={danger ? palette.orange : palette.green} />
    </Pressable>
  );
}
