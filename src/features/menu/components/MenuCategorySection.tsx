import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { CategoryDirection, MenuCategory, MenuItem } from '../types';

type CategorySectionProps = {
  category?: MenuCategory;
  name?: string;
  items: MenuItem[];
  first?: boolean;
  last?: boolean;
  busy: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: (direction: CategoryDirection) => void;
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
        {props.category ? <CategoryActions {...props} /> : null}
      </View>
      {props.items.length === 0 ? (
        <Text style={styles.emptyText}>No items in this category yet.</Text>
      ) : (
        props.items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            disabled={props.busy}
            onPress={() => props.onItem(item)}
            onDelete={() => props.onDeleteItem(item)}
          />
        ))
      )}
    </View>
  );
}

function CategoryActions(props: CategorySectionProps) {
  return (
    <>
      <SmallButton
        icon="arrow-up"
        disabled={props.busy || props.first}
        label="Move category up"
        onPress={() => props.onMove?.('up')}
      />
      <SmallButton
        icon="arrow-down"
        disabled={props.busy || props.last}
        label="Move category down"
        onPress={() => props.onMove?.('down')}
      />
      <SmallButton icon="pencil-outline" disabled={props.busy} label="Edit category" onPress={props.onEdit} />
      <SmallButton
        icon="trash-outline"
        disabled={props.busy}
        label="Delete category"
        danger
        onPress={props.onDelete}
      />
    </>
  );
}

function MenuItemCard({
  item,
  disabled,
  onPress,
  onDelete,
}: {
  item: MenuItem;
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
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.itemPhoto} />
      ) : (
        <View style={[styles.itemPhoto, styles.itemPhotoEmpty]}>
          <Ionicons name="cafe-outline" size={25} color={palette.green} />
        </View>
      )}
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
