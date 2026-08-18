import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '../../../lib/design';
import { safeErrorMessage } from '../../../lib/errors';
import { useItemsByCategory } from '../selectors';
import { styles } from '../styles';
import { MenuCategory, MenuItem } from '../types';

import { EmptyMenu } from './EmptyMenu';
import { MenuCategorySection } from './MenuCategorySection';
import { MenuError, MenuHeader } from './MenuUI';

type Props = {
  categories: MenuCategory[];
  items: MenuItem[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onAddDefaults: () => Promise<void>;
  onAddItem: () => void;
  onCreateCategory: () => void;
  onManageCategories: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => Promise<void>;
  onRetry: () => void;
};

export function MenuOverview(props: Props) {
  const groupedItems = useItemsByCategory(props.items);
  const uncategorized = groupedItems.get(null) ?? [];

  const confirmItemDelete = (item: MenuItem) =>
    Alert.alert('Delete menu item?', `${item.name} and its uploaded photo will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => run(props.onDeleteItem(item), 'Could not delete item'),
      },
    ]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MenuHeader title="Menu" onBack={props.onBack} />
        <Text style={styles.intro}>
          Create categories and keep prices, photos, and availability accurate for customers.
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add menu item"
            disabled={props.busy}
            onPress={props.onAddItem}
            style={[styles.primaryButton, props.busy && styles.disabled]}
          >
            <Ionicons name="add" size={19} color={palette.paper} />
            <Text style={styles.primaryText}>Add item</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage categories"
            disabled={props.busy}
            onPress={props.onManageCategories}
            style={[styles.secondaryButton, props.busy && styles.disabled]}
          >
            <Ionicons name="albums-outline" size={18} color={palette.green} />
            <Text style={styles.secondaryText}>Manage categories</Text>
          </Pressable>
        </View>
        {props.loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={palette.green} />
          </View>
        ) : props.error ? (
          <MenuError message={props.error} onRetry={props.onRetry} />
        ) : props.categories.length === 0 ? (
          <>
            <EmptyMenu
              busy={props.busy}
              onAddCategory={props.onCreateCategory}
              onAddDefaults={() => run(props.onAddDefaults(), 'Could not add starter categories')}
            />
            {uncategorized.length > 0 && (
              <MenuCategorySection
                name="Uncategorized"
                items={uncategorized}
                busy={props.busy}
                onItem={props.onEditItem}
                onDeleteItem={confirmItemDelete}
              />
            )}
          </>
        ) : (
          <>
            {props.categories.map((category) => (
              <MenuCategorySection
                key={category.id}
                category={category}
                items={groupedItems.get(category.id) ?? []}
                busy={props.busy}
                onItem={props.onEditItem}
                onDeleteItem={confirmItemDelete}
              />
            ))}
            {uncategorized.length > 0 && (
              <MenuCategorySection
                name="Uncategorized"
                items={uncategorized}
                busy={props.busy}
                onItem={props.onEditItem}
                onDeleteItem={confirmItemDelete}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function run(promise: Promise<void>, title: string) {
  promise.catch((error) => Alert.alert(title, safeErrorMessage(error, 'Please try again.')));
}
