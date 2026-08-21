import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../../components/ui/AppButton';
import { palette } from '../../../lib/design';
import { useCategoryManager } from '../categoryHooks';
import { categoryStyles as cs } from '../categoryStyles';
import { styles } from '../styles';
import { MenuCategory } from '../types';

import { CategoryEditorCard } from './CategoryEditorCard';
import { CategoryManagerRow } from './CategoryManagerRow';
import { EmptyMenu } from './EmptyMenu';
import { MenuError, MenuHeader } from './MenuUI';

export function CategoryManagerScreen({
  manager,
  onBack,
}: {
  manager: ReturnType<typeof useCategoryManager>;
  onBack: () => void;
}) {
  const confirmDelete = (category: MenuCategory) => {
    const itemCount = manager.itemCounts.get(category.id) ?? 0;
    Alert.alert(
      'Delete category?',
      itemCount
        ? `${itemCount} item${itemCount === 1 ? '' : 's'} will move to Uncategorized.`
        : `${category.name} will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void manager.remove(category.id).catch(() => undefined),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <MenuHeader title="Manage categories" onBack={onBack} />
        <Text style={styles.intro}>
          Keep the customer menu easy to scan. Categories can be renamed, reordered, or removed at any time.
        </Text>
        {manager.successMessage ? (
          <View accessibilityLiveRegion="polite" style={cs.banner}>
            <Text style={cs.bannerText}>{manager.successMessage}</Text>
          </View>
        ) : null}
        {manager.editor ? (
          <CategoryEditorCard
            busy={manager.busy}
            checkFailed={manager.nameCheckFailed}
            checking={manager.checkingName}
            editing={manager.editor !== 'new'}
            error={manager.editorError}
            exactMatch={manager.exactMatch}
            iconKey={manager.iconKey}
            name={manager.name}
            similarConfirmed={manager.similarConfirmed}
            similarMatches={manager.similarMatches}
            onCancel={manager.closeEditor}
            onConfirmSimilar={manager.confirmSimilar}
            onIconChange={manager.setIconKey}
            onNameChange={manager.setName}
            onRetryCheck={manager.retryNameCheck}
            onSave={() => void manager.save()}
          />
        ) : manager.categories.length > 0 ? (
          <AppButton label="Add category" disabled={manager.busy} onPress={() => manager.openEditor('new')} />
        ) : null}

        {manager.loading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="hourglass-outline" size={30} color={palette.green} />
            <Text style={styles.emptyText}>Loading categories…</Text>
          </View>
        ) : manager.error && !manager.editor && manager.categories.length === 0 ? (
          <MenuError message={manager.error} onRetry={manager.refresh} />
        ) : manager.categories.length === 0 ? (
          <EmptyMenu
            busy={manager.busy}
            onAddCategory={() => manager.openEditor('new')}
            onAddDefaults={() => void manager.addDefaults().catch(() => undefined)}
          />
        ) : (
          <>
            {manager.error && !manager.editor ? (
              <View accessibilityLiveRegion="assertive" style={[cs.banner, cs.errorBanner]}>
                <Text style={cs.errorText}>{manager.error}</Text>
              </View>
            ) : null}
            <View style={cs.listHeader}>
              <Text style={cs.listTitle}>Your categories</Text>
              <Text style={cs.count}>{manager.categories.length} total</Text>
            </View>
            {manager.categories.map((category) => (
              <CategoryManagerRow
                key={category.id}
                busy={manager.busy}
                category={category}
                itemCount={manager.itemCounts.get(category.id) ?? 0}
                onDelete={() => confirmDelete(category)}
                onEdit={() => manager.openEditor(category)}
              />
            ))}
          </>
        )}
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.retryButton}>
          <Text style={styles.secondaryText}>Return to menu</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
