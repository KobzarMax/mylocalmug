import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '../../../lib/design';
import { useMenuCategoryEditor } from '../hooks';
import { styles } from '../styles';
import { MenuCategory } from '../types';

import { MenuHeader } from './MenuUI';

export function CategoryForm({
  businessId,
  category,
  nextSortOrder,
  onBack,
  onSaved,
}: {
  businessId: string;
  category: MenuCategory | null;
  nextSortOrder: number;
  onBack: () => void;
  onSaved: () => void;
}) {
  const form = useMenuCategoryEditor(businessId, category, nextSortOrder, onSaved);
  const submit = () =>
    form.submit().catch((caught) => {
      Alert.alert('Could not save category', caught instanceof Error ? caught.message : 'Please try again.');
    });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <MenuHeader title={category ? 'Edit category' : 'New category'} onBack={onBack} />
        <Text style={styles.intro}>
          Categories keep the menu easy to scan and can be reordered at any time.
        </Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Category name</Text>
          <TextInput
            accessibilityLabel="Category name"
            autoFocus
            value={form.name}
            onChangeText={form.setName}
            editable={!form.busy}
            maxLength={60}
            placeholder="Coffee"
            placeholderTextColor={palette.placeholder}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            disabled={form.busy}
            onPress={submit}
            style={[styles.submitButton, form.busy && styles.disabled]}
          >
            {form.busy ? (
              <ActivityIndicator color={palette.paper} />
            ) : (
              <Text style={styles.submitText}>Save category</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
