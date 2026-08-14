import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { OfflineNotice } from '../../components/OfflineNotice';
import { palette } from '../../lib/design';
import { useMarketplace } from './hooks';
import { styles } from './styles';
import { MarketplaceList } from './components/MarketplaceList';
import { ShopDetailScreen } from './components/ShopDetailScreen';

export function MarketplaceEntry({ accountId, displayName, onOpenContent }: { accountId: string; displayName: string; onOpenContent: (contentId: string) => void }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const marketplace = useMarketplace(query);
  if (selectedId) return <ShopDetailScreen accountId={accountId} businessId={selectedId} onBack={() => setSelectedId(null)} onOpenContent={onOpenContent} />;
  const firstName = displayName.trim().split(/\s+/)[0] || 'there';
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <View style={styles.topRow}><View><Text style={styles.overline}>Discover local coffee</Text><Text style={styles.title}>Hello, {firstName}</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text></View></View>
    <View style={styles.search}><Ionicons name="search" size={20} color={palette.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Coffee shops, categories, menu items…" placeholderTextColor="#9B918A" style={styles.searchInput} /></View>
    <Text style={styles.sectionTitle}>{query.trim() ? 'Search results' : 'Local coffee shops'}</Text>
    <OfflineNotice isOnline={marketplace.isOnline} updatedAt={marketplace.dataUpdatedAt} stale={Boolean(marketplace.error && marketplace.data.length)} />
    <MarketplaceList items={marketplace.data} loading={marketplace.loading} error={marketplace.error} isOnline={marketplace.isOnline} hasMore={Boolean(marketplace.hasNextPage)} loadingMore={marketplace.isFetchingNextPage} onOpen={setSelectedId} onRetry={() => void marketplace.refresh()} onLoadMore={() => void marketplace.fetchNextPage()} />
  </ScrollView></SafeAreaView>;
}
