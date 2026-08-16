import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

import { OfflineNotice } from '../../components/OfflineNotice';
import { palette } from '../../lib/design';

import { MarketplaceList } from './components/MarketplaceList';
import { useMarketplace } from './hooks';
import { styles } from './styles';

export function MarketplaceEntry({
  displayName,
  onOpenBusiness,
}: {
  displayName: string;
  onOpenBusiness: (businessId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const marketplace = useMarketplace(query);
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <View>
            <Text style={styles.overline}>Discover local coffee</Text>
            <Text style={styles.title}>Hello, {firstName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={palette.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Coffee shops, categories, menu items…"
            placeholderTextColor={palette.placeholder}
            style={styles.searchInput}
          />
        </View>
        <Text style={styles.sectionTitle}>{query.trim() ? 'Search results' : 'Local coffee shops'}</Text>
        <OfflineNotice
          isOnline={marketplace.isOnline}
          updatedAt={marketplace.dataUpdatedAt}
          stale={Boolean(marketplace.error && marketplace.data.length)}
        />
        <MarketplaceList
          items={marketplace.data}
          loading={marketplace.loading}
          error={marketplace.error}
          isOnline={marketplace.isOnline}
          hasMore={Boolean(marketplace.hasNextPage)}
          loadingMore={marketplace.isFetchingNextPage}
          onOpen={onOpenBusiness}
          onRetry={() => void marketplace.refresh()}
          onLoadMore={() => void marketplace.fetchNextPage()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
