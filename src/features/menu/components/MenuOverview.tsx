import React from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../lib/design';
import { useItemsByCategory } from '../hooks';
import { styles } from '../styles';
import { CategoryDirection, MenuCategory, MenuItem } from '../types';
import { MenuError, MenuHeader } from './MenuUI';

type Props = {
  categories: MenuCategory[];
  items: MenuItem[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onAddCategory: () => void;
  onEditCategory: (category: MenuCategory) => void;
  onDeleteCategory: (category: MenuCategory) => Promise<void>;
  onMoveCategory: (categoryId: string, direction: CategoryDirection) => Promise<void>;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => Promise<void>;
  onRetry: () => void;
};

export function MenuOverview(props: Props) {
  const groupedItems = useItemsByCategory(props.items);
  const uncategorized = groupedItems.get(null) ?? [];

  const confirmCategoryDelete = (category: MenuCategory) => {
    const itemCount = groupedItems.get(category.id)?.length ?? 0;
    Alert.alert('Delete category?', itemCount
      ? `${itemCount} item${itemCount === 1 ? '' : 's'} will move to Uncategorized.`
      : 'This category will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => run(props.onDeleteCategory(category), 'Could not delete category') },
    ]);
  };

  const confirmItemDelete = (item: MenuItem) => Alert.alert('Delete menu item?', `${item.name} and its uploaded photo will be removed.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => run(props.onDeleteItem(item), 'Could not delete item') },
  ]);

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <MenuHeader title="Menu" onBack={props.onBack} />
    <Text style={styles.intro}>Create categories and keep prices, photos, and availability accurate for customers.</Text>
    <View style={styles.actions}>
      <Pressable disabled={props.busy} onPress={props.onAddItem} style={[styles.primaryButton, props.busy && styles.disabled]}>
        <Ionicons name="add" size={19} color={palette.paper} /><Text style={styles.primaryText}>Add item</Text>
      </Pressable>
      <Pressable disabled={props.busy} onPress={props.onAddCategory} style={[styles.secondaryButton, props.busy && styles.disabled]}>
        <Ionicons name="albums-outline" size={18} color={palette.green} /><Text style={styles.secondaryText}>Add category</Text>
      </Pressable>
    </View>
    {props.loading ? <View style={styles.emptyCard}><ActivityIndicator color={palette.green} /></View>
      : props.error ? <MenuError message={props.error} onRetry={props.onRetry} />
      : props.categories.length === 0 && props.items.length === 0 ? <EmptyMenu onAddCategory={props.onAddCategory} />
      : <>
        {props.categories.map((category, index) => <CategorySection
          key={category.id}
          category={category}
          items={groupedItems.get(category.id) ?? []}
          first={index === 0}
          last={index === props.categories.length - 1}
          busy={props.busy}
          onEdit={() => props.onEditCategory(category)}
          onDelete={() => confirmCategoryDelete(category)}
          onMove={(direction) => run(props.onMoveCategory(category.id, direction), 'Could not reorder categories')}
          onItem={props.onEditItem}
          onDeleteItem={confirmItemDelete}
        />)}
        {uncategorized.length > 0 && <CategorySection name="Uncategorized" items={uncategorized} busy={props.busy} onItem={props.onEditItem} onDeleteItem={confirmItemDelete} />}
      </>}
  </ScrollView></SafeAreaView>;
}

function CategorySection({ category, name, items, first, last, busy, onEdit, onDelete, onMove, onItem, onDeleteItem }: {
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
}) {
  return <View>
    <View style={styles.categoryHeader}>
      <Text style={styles.categoryName}>{category?.name ?? name}</Text><Text style={styles.categoryCount}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
      {category && <>
        <SmallButton icon="arrow-up" disabled={busy || first} label="Move category up" onPress={() => onMove?.('up')} />
        <SmallButton icon="arrow-down" disabled={busy || last} label="Move category down" onPress={() => onMove?.('down')} />
        <SmallButton icon="pencil-outline" disabled={busy} label="Edit category" onPress={onEdit} />
        <SmallButton icon="trash-outline" disabled={busy} label="Delete category" danger onPress={onDelete} />
      </>}
    </View>
    {items.length === 0 ? <Text style={styles.emptyText}>No items in this category yet.</Text>
      : items.map((item) => <MenuItemCard key={item.id} item={item} disabled={busy} onPress={() => onItem(item)} onDelete={() => onDeleteItem(item)} />)}
  </View>;
}

function MenuItemCard({ item, disabled, onPress, onDelete }: { item: MenuItem; disabled: boolean; onPress: () => void; onDelete: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.itemCard, disabled && styles.disabled]}>
    {item.photoUrl ? <Image source={{ uri: item.photoUrl }} style={styles.itemPhoto} /> : <View style={[styles.itemPhoto, styles.itemPhotoEmpty]}><Ionicons name="cafe-outline" size={25} color={palette.green} /></View>}
    <View style={styles.itemBody}>
      <View style={styles.itemTop}><Text numberOfLines={1} style={styles.itemName}>{item.name}</Text><Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text></View>
      {item.description ? <Text numberOfLines={2} style={styles.itemDescription}>{item.description}</Text> : null}
      <View style={[styles.availability, !item.isAvailable && styles.unavailable]}><Text style={styles.availabilityText}>{item.isAvailable ? 'Available' : 'Unavailable'}</Text></View>
    </View>
    <SmallButton icon="trash-outline" disabled={disabled} label={`Delete ${item.name}`} danger onPress={onDelete} />
  </Pressable>;
}

function SmallButton({ icon, disabled, label, danger, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; disabled?: boolean; label: string; danger?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={(event) => { event.stopPropagation(); onPress?.(); }} style={[styles.compactButton, disabled && styles.iconButtonDisabled]}>
    <Ionicons name={icon} size={18} color={danger ? palette.orange : palette.green} />
  </Pressable>;
}

function EmptyMenu({ onAddCategory }: { onAddCategory: () => void }) {
  return <View style={styles.emptyCard}><Ionicons name="restaurant-outline" size={34} color={palette.green} /><Text style={styles.emptyTitle}>Start your menu</Text><Text style={styles.emptyText}>Create a category such as Coffee, Tea, or Food, then add the first item.</Text><Pressable onPress={onAddCategory} style={styles.submitButton}><Text style={styles.submitText}>Create first category</Text></Pressable></View>;
}

function run(promise: Promise<void>, title: string) {
  promise.catch((caught) => Alert.alert(title, caught instanceof Error ? caught.message : 'Please try again.'));
}
