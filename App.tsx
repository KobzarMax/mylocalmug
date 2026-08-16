import 'react-native-url-polyfill/auto';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRole } from './src/types';
import { EditProfileScreen } from './src/components/EditProfileScreen';
import { BusinessPortal } from './src/features/business/BusinessPortal';
import { getProfileAvatarUrl } from './src/lib/profileImage';
import { AuthEntry } from './src/features/auth/AuthEntry';
import { useAuthenticatedAccount } from './src/features/auth/sessionHooks';
import { AccountLoadError } from './src/features/auth/components/AccountLoadError';
import { CustomerContentEntry } from './src/features/content/CustomerContentEntry';
import { subscribeToContentNotifications } from './src/features/content/device';
import { usePushDeviceRefresh } from './src/features/content/hooks';
import { MarketplaceEntry } from './src/features/marketplace/MarketplaceEntry';
import { useAccountCacheBoundary } from './src/lib/query/QueryProvider';
import { CustomerRewardsEntry } from './src/features/rewards/CustomerRewardsEntry';

const C = {
  ink: '#241A16',
  muted: '#766A63',
  cream: '#F7F2EA',
  paper: '#FFFDFC',
  green: '#235C4B',
  mint: '#DDEBE4',
  orange: '#D9773E',
  line: '#E9E0D7',
  gold: '#E2A43B',
};

type Tab = 'discover' | 'loyalty' | 'news' | 'profile';
type Experience = 'customer' | 'business';
export default function App() {
  const account = useAuthenticatedAccount();
  const { session, profile } = account;
  const [experience, setExperience] = useState<Experience>('customer');
  const [tab, setTab] = useState<Tab>('discover');
  const [editingProfile, setEditingProfile] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  usePushDeviceRefresh(Boolean(session));
  useAccountCacheBoundary(session?.user.id ?? null);
  const openContent = useCallback((id: string) => {
    setExperience('customer');
    setEditingProfile(false);
    setTab('news');
    setContentId(id);
  }, []);
  useEffect(() => {
    const openUrl = (url: string | null) => {
      const match = url?.match(/^localmug:\/\/content\/([0-9a-f-]{36})/i);
      if (match) openContent(match[1]);
    };
    void Linking.getInitialURL().then(openUrl);
    const links = Linking.addEventListener('url', ({ url }) => openUrl(url));
    const notifications = subscribeToContentNotifications(openContent);
    return () => { links.remove(); notifications.remove(); };
  }, [openContent]);
  useEffect(() => {
    if (session) return;
    setExperience('customer');
    setEditingProfile(false);
    setTab('discover');
    setContentId(null);
  }, [session]);

  if (account.loadingSession) return <LoadingScreen />;
  if (!session) return <AuthEntry />;
  if (account.profileError) return <AccountLoadError message={account.profileError} onRetry={account.reloadProfile} onSignOut={account.signOut} />;
  if (!profile) return <LoadingScreen />;
  if (experience === 'business') {
    return (
      <BusinessPortal
        userId={session.user.id}
        email={session.user.email ?? ''}
        displayName={profile.display_name}
        onBack={() => setExperience('customer')}
        onSignOut={account.signOut}
      />
    );
  }
  if (editingProfile && profile) {
    return (
      <EditProfileScreen
        profile={profile}
        email={session.user.email ?? ''}
        onBack={() => setEditingProfile(false)}
        onSaved={(nextProfile) => {
          account.setProfile(nextProfile);
          setEditingProfile(false);
        }}
      />
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.cream} />
      <View style={styles.app}>
        <>
            <View style={styles.screen}>
              {tab === 'discover' && <MarketplaceEntry accountId={session.user.id} displayName={profile.display_name} onOpenContent={openContent} />}
              {tab === 'loyalty' && <CustomerRewardsEntry accountId={session.user.id} />}
              {tab === 'news' && <CustomerContentEntry accountId={session.user.id} initialContentId={contentId} onInitialContentHandled={() => setContentId(null)} />}
              {tab === 'profile' && (
                <ProfileScreen
                  displayName={profile?.display_name ?? session.user.email?.split('@')[0] ?? 'Alex'}
                  email={session.user.email ?? ''}
                  description={profile?.description ?? ''}
                  avatarPath={profile?.avatar_path ?? null}
                  onEdit={() => setEditingProfile(true)}
                  onSignOut={account.signOut}
                  onSwitch={() => setExperience('business')}
                />
              )}
            </View>
            <BottomNav tab={tab} setTab={setTab} />
          </>
      </View>
    </SafeAreaView>
  );
}

function LoadingScreen() {
  return (
    <LinearGradient colors={['#F8F1E8', '#E3EEE7']} style={styles.centeredScreen}>
      <ActivityIndicator color={C.green} size="large" />
      <Text style={styles.loadingText}>Opening Local Mug...</Text>
    </LinearGradient>
  );
}

function RoleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.roleChip, active && styles.roleChipActive]}>
      <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Welcome({ onSelect }: { onSelect: (role: UserRole) => void }) {
  return (
    <LinearGradient colors={['#F8F1E8', '#E3EEE7']} style={styles.welcome}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.beanMark}>
        <Ionicons name="cafe" size={38} color={C.paper} />
      </View>
      <Text style={styles.brand}>Local Mug</Text>
      <Text style={styles.hero}>Coffee tastes better{'\n'}when it’s local.</Text>
      <Text style={styles.heroSub}>
        Discover independent coffee shops, collect stamps, and become part of your neighbourhood.
      </Text>
      <View style={styles.rolePanel}>
        <Text style={styles.eyebrow}>HOW WILL YOU USE LOCAL MUG?</Text>
        <RoleButton
          icon="heart-outline"
          title="I love local coffee"
          subtitle="Find shops, earn rewards, and leave reviews"
          onPress={() => onSelect('client')}
        />
        <RoleButton
          icon="storefront-outline"
          title="I run a coffee shop"
          subtitle="Manage your menu, community, and rewards"
          onPress={() => onSelect('business')}
        />
      </View>
      <Text style={styles.smallPrint}>By continuing, you agree to our Terms and Privacy Policy.</Text>
    </LinearGradient>
  );
}

function RoleButton(props: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.roleButton, pressed && styles.pressed]} onPress={props.onPress}>
      <View style={styles.roleIcon}><Ionicons name={props.icon} size={24} color={C.green} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{props.title}</Text>
        <Text style={styles.roleSub}>{props.subtitle}</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color={C.ink} />
    </Pressable>
  );
}

function ProfileScreen({
  displayName,
  email,
  description,
  avatarPath,
  onEdit,
  onSignOut,
  onSwitch,
}: {
  displayName: string;
  email: string;
  description: string;
  avatarPath: string | null;
  onEdit: () => void;
  onSignOut: () => void;
  onSwitch: () => void;
}) {
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = getProfileAvatarUrl(avatarPath);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.hello}>YOUR ACCOUNT</Text><Text style={styles.title}>{displayName}</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarLargeImage} /> : <Text style={styles.avatarLargeText}>{initials || 'LM'}</Text>}
        </View>
        <Text style={styles.description}>{email}</Text>
        {description ? <Text style={styles.profileDescription}>{description}</Text> : null}
        <Text style={styles.description}>Coffee explorer since July 2026</Text>
      </View>
      {['Edit profile', 'Your reviews', 'Saved coffee shops', 'Notifications', 'Privacy & security'].map((x) => (
        <Pressable key={x} onPress={x === 'Edit profile' ? onEdit : undefined} style={styles.setting}><Text style={styles.menuName}>{x}</Text><Ionicons name="chevron-forward" size={18} color={C.muted} /></Pressable>
      ))}
      <Pressable onPress={onSwitch} style={styles.secondaryButton}><Text style={styles.secondaryText}>Open business portal</Text></Pressable>
      <Pressable onPress={onSignOut} style={styles.signOutButton}><Ionicons name="log-out-outline" size={18} color={C.orange} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
    </ScrollView>
  );
}

function BusinessDashboard({
  displayName,
  onSignOut,
  onSwitch,
}: {
  displayName: string;
  onSignOut: () => void;
  onSwitch: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topRow}><View><Text style={styles.hello}>WILLOW & BEAN</Text><Text style={styles.title}>Good morning, {displayName.split(' ')[0]}</Text></View><View style={styles.avatar}><Ionicons name="storefront" size={20} color={C.green} /></View></View>
      <LinearGradient colors={['#255F4E', '#163F35']} style={styles.businessHero}>
        <Text style={styles.businessOverline}>TODAY AT A GLANCE</Text>
        <View style={styles.metricRow}>
          <Metric value="34" label="Stamps issued" />
          <Metric value="7" label="New members" />
          <Metric value="4.8" label="Avg. rating" />
        </View>
      </LinearGradient>
      <SectionHeader title="Quick actions" />
      <View style={styles.quickGrid}>
        <Quick icon="restaurant-outline" label="Update menu" />
        <Quick icon="newspaper-outline" label="Post news" />
        <Quick icon="gift-outline" label="Create reward" />
        <Quick icon="calendar-outline" label="Add event" />
      </View>
      <SectionHeader title="Your live rewards" action="Manage" />
      <View style={styles.rewardCard}><Text style={styles.rewardShop}>Coffee stamp card</Text><Text style={styles.rewardMeta}>10 cups → 1 free drink · 284 members</Text><View style={styles.activePill}><Text style={styles.activeText}>ACTIVE</Text></View></View>
      <SectionHeader title="Recent reviews" action="See all" />
      <View style={styles.reviewCard}><View style={styles.inline}><Text style={styles.menuName}>Jamie R.</Text><View style={{ flex: 1 }} /><Text style={styles.rating}>★★★★★</Text></View><Text style={styles.description}>Friendly team and the flat white was perfect. My favourite spot to work nearby.</Text></View>
      <Pressable onPress={onSwitch} style={styles.secondaryButton}><Text style={styles.secondaryText}>Switch to customer preview</Text></Pressable>
      <Pressable onPress={onSignOut} style={styles.signOutButton}><Ionicons name="log-out-outline" size={18} color={C.orange} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
    </ScrollView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Quick({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return <Pressable style={styles.quick}><View style={styles.quickIcon}><Ionicons name={icon} size={22} color={C.green} /></View><Text style={styles.quickText}>{label}</Text></Pressable>;
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action && <Text style={styles.sectionAction}>{action}</Text>}</View>;
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items: { id: Tab; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
    { id: 'discover', icon: 'compass-outline', label: 'Discover' },
    { id: 'loyalty', icon: 'ticket-outline', label: 'Rewards' },
    { id: 'news', icon: 'newspaper-outline', label: 'News' },
    { id: 'profile', icon: 'person-outline', label: 'Profile' },
  ];
  return <View style={styles.nav}>{items.map((item) => <Pressable key={item.id} style={styles.navItem} onPress={() => setTab(item.id)}><Ionicons name={tab === item.id ? item.icon.replace('-outline', '') as any : item.icon} size={22} color={tab === item.id ? C.green : '#9A908A'} /><Text style={[styles.navLabel, tab === item.id && styles.navActive]}>{item.label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  app: { flex: 1, backgroundColor: C.cream },
  screen: { flex: 1 },
  centeredScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 14, fontSize: 13, fontWeight: '700', color: C.green },
  scroll: { padding: 20, paddingBottom: 40 },
  roleToggle: { flexDirection: 'row', gap: 9 },
  roleChip: { flex: 1, height: 44, borderWidth: 1, borderColor: C.line, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFEFC' },
  roleChipActive: { backgroundColor: C.mint, borderColor: C.green },
  roleChipText: { fontSize: 13, fontWeight: '800', color: C.muted },
  roleChipTextActive: { color: C.green },
  welcome: { flex: 1, paddingHorizontal: 24, paddingTop: 72, paddingBottom: 28, alignItems: 'center' },
  beanMark: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  brand: { marginTop: 14, fontSize: 17, fontWeight: '800', letterSpacing: 2.2, textTransform: 'uppercase', color: C.green },
  hero: { marginTop: 42, fontSize: 38, lineHeight: 44, letterSpacing: -1.2, fontWeight: '800', color: C.ink, textAlign: 'center' },
  heroSub: { marginTop: 16, maxWidth: 340, fontSize: 16, lineHeight: 24, color: C.muted, textAlign: 'center' },
  rolePanel: { width: '100%', marginTop: 42 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, color: C.muted, marginBottom: 12 },
  roleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.paper, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.line, shadowColor: '#3A2B22', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  roleIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  roleSub: { fontSize: 12, color: C.muted, marginTop: 3 },
  smallPrint: { marginTop: 'auto', color: C.muted, fontSize: 11, textAlign: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { fontSize: 11, letterSpacing: 1.2, fontWeight: '800', color: C.orange, textTransform: 'uppercase' },
  title: { fontSize: 27, letterSpacing: -0.7, fontWeight: '800', color: C.ink, marginTop: 4 },
  avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '800', color: C.green },
  search: { height: 52, marginTop: 22, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  searchInput: { flex: 1, fontSize: 14, color: C.ink, marginHorizontal: 10 },
  location: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  locationText: { fontSize: 12, color: C.muted, marginLeft: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.ink },
  sectionAction: { fontSize: 12, fontWeight: '700', color: C.green },
  cardsRow: { gap: 13, paddingRight: 20 },
  shopCard: { width: 245, borderRadius: 18, overflow: 'hidden', backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  shopImage: { width: '100%', height: 132 },
  distance: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,253,252,0.94)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  distanceText: { fontSize: 11, fontWeight: '700', color: C.ink },
  shopBody: { padding: 13 },
  shopName: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 5 },
  inline: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 12, fontWeight: '700', color: C.ink, marginLeft: 3 },
  dot: { color: C.muted },
  meta: { fontSize: 12, lineHeight: 17, color: C.muted },
  rewardCard: { backgroundColor: C.paper, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line },
  rewardTop: { flexDirection: 'row', alignItems: 'center' },
  miniLogo: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  rewardShop: { fontSize: 15, fontWeight: '800', color: C.ink },
  rewardMeta: { fontSize: 11, color: C.muted, marginTop: 3 },
  rewardCount: { fontSize: 13, fontWeight: '800', color: C.green },
  stamps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  stamp: { width: 27, height: 27, borderRadius: 9, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  stampActive: { backgroundColor: C.green },
  detailHero: { width: '100%', height: 285 },
  backButton: { position: 'absolute', top: 14, left: 16, width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,253,252,0.94)', alignItems: 'center', justifyContent: 'center' },
  heartButton: { position: 'absolute', top: 14, right: 16, width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,253,252,0.94)', alignItems: 'center', justifyContent: 'center' },
  detailBody: { padding: 20 },
  detailTitle: { fontSize: 29, fontWeight: '800', color: C.ink, letterSpacing: -0.7, marginBottom: 7 },
  description: { fontSize: 14, lineHeight: 21, color: C.muted, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 20 },
  action: { flex: 1, alignItems: 'center', gap: 5, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 11 },
  actionText: { fontSize: 10, fontWeight: '700', color: C.green },
  primaryButton: { marginTop: 14, height: 52, borderRadius: 16, backgroundColor: C.green, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: C.paper, fontSize: 14, fontWeight: '800' },
  menuRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: 'center' },
  menuImage: { width: 64, height: 64, borderRadius: 14 },
  menuName: { fontSize: 14, fontWeight: '700', color: C.ink },
  price: { fontSize: 14, fontWeight: '800', color: C.green },
  walletHero: { borderRadius: 22, padding: 22, marginTop: 20 },
  walletLabel: { color: '#BFD7CE', fontSize: 10, letterSpacing: 1.3, fontWeight: '800' },
  walletNumber: { color: C.paper, fontSize: 44, fontWeight: '800', marginTop: 4 },
  walletHint: { color: '#D8E6E0', fontSize: 12 },
  loyaltyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: C.paper, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  progress: { height: 5, backgroundColor: C.mint, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: C.green, borderRadius: 3 },
  profileCard: { marginTop: 20, alignItems: 'center', backgroundColor: C.paper, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: C.line },
  avatarLarge: { width: 78, height: 78, borderRadius: 27, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarLargeImage: { width: '100%', height: '100%' },
  avatarLargeText: { color: C.paper, fontSize: 23, fontWeight: '800' },
  profileDescription: { marginTop: 10, maxWidth: 280, color: C.ink, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 17, borderBottomColor: C.line, borderBottomWidth: 1 },
  secondaryButton: { height: 50, borderWidth: 1, borderColor: C.green, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  secondaryText: { color: C.green, fontWeight: '800', fontSize: 13 },
  signOutButton: { height: 48, borderWidth: 1, borderColor: '#F0C7AD', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12, flexDirection: 'row', gap: 7, backgroundColor: '#FFF7F2' },
  signOutText: { color: C.orange, fontWeight: '800', fontSize: 13 },
  businessHero: { marginTop: 22, padding: 20, borderRadius: 22 },
  businessOverline: { color: '#BFD7CE', fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },
  metricRow: { flexDirection: 'row', marginTop: 18 },
  metric: { flex: 1 },
  metricValue: { fontSize: 27, fontWeight: '800', color: C.paper },
  metricLabel: { marginTop: 2, fontSize: 10, color: '#D8E6E0' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quick: { width: '48.5%', padding: 15, borderRadius: 16, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center' },
  quickIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  quickText: { fontSize: 12, color: C.ink, fontWeight: '700' },
  activePill: { alignSelf: 'flex-start', marginTop: 13, backgroundColor: C.mint, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8 },
  activeText: { fontSize: 9, letterSpacing: 1, fontWeight: '800', color: C.green },
  reviewCard: { padding: 17, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  nav: { height: 70, paddingBottom: 6, backgroundColor: C.paper, borderTopWidth: 1, borderTopColor: C.line, flexDirection: 'row' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navLabel: { fontSize: 9, fontWeight: '600', color: '#9A908A' },
  navActive: { color: C.green, fontWeight: '800' },
});
