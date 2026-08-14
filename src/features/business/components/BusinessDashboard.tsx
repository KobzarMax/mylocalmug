import React from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { hasPermission } from '../permissions';
import { Permission, Workspace } from '../types';
import { colors, styles } from '../styles';

export function BusinessDashboard({ workspace, displayName, onBack, onSignOut, onEditProfile, onOpenMenu, onOpenContent, onOpenTeam, onOpenPayments, onReviewApplications }: { workspace: Workspace; displayName: string; onBack: () => void; onSignOut: () => void; onEditProfile: () => void; onOpenMenu: () => void; onOpenContent: () => void; onOpenTeam: () => void; onOpenPayments: () => void; onReviewApplications?: () => void }) {
  const { business, role } = workspace;
  const completion = Math.round(([business.description, business.address, business.contactEmail, business.contactPhone, business.websiteUrl].filter(Boolean).length / 5) * 100);
  const allActions: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; permission: Permission; action?: () => void }[] = [
    { icon: 'storefront-outline', label: 'Edit profile', permission: 'business.profile.write', action: onEditProfile },
    { icon: 'restaurant-outline', label: 'Menu', permission: 'menu.manage', action: onOpenMenu },
    { icon: 'newspaper-outline', label: 'News & events', permission: 'content.manage', action: onOpenContent },
    { icon: 'gift-outline', label: 'Rewards', permission: 'rewards.manage' },
    { icon: 'people-outline', label: 'Team', permission: 'team.read', action: onOpenTeam },
    { icon: 'card-outline', label: 'Payments', permission: 'payments.read', action: onOpenPayments },
  ];
  const actions = allActions.filter((item) => hasPermission(role, item.permission));
  if (onReviewApplications) actions.push({ icon: 'shield-checkmark-outline', label: 'Application reviews', permission: 'business.profile.write', action: onReviewApplications });

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <View style={styles.topRow}><Pressable onPress={onBack} style={styles.iconButton}><Ionicons name="swap-horizontal" size={20} color={colors.green} /></Pressable><View style={styles.topTitle}><Text style={styles.overline}>{business.name}</Text><Text style={styles.pageTitle}>Good morning, {displayName.split(' ')[0]}</Text></View><View style={styles.rolePill}><Text style={styles.roleText}>{role}</Text></View></View>
    <LinearGradient colors={['#255F4E', '#163F35']} style={styles.hero}><Text style={styles.heroOverline}>BUSINESS SETUP</Text><Text style={styles.heroValue}>{completion}% complete</Text><View style={styles.progress}><View style={[styles.progressFill, { width: `${completion}%` }]} /></View><Text style={styles.heroHint}>{business.isPublished ? 'Your profile is visible to customers.' : 'Your profile is private until it is ready to publish.'}</Text></LinearGradient>
    <View style={styles.stateCard}><View><Text style={styles.cardTitle}>Profile status</Text><Text style={styles.cardText}>{business.status === 'active' ? 'Active' : 'Complete setup before publishing'}</Text></View><View style={[styles.statePill, business.isPublished && styles.livePill]}><Text style={styles.stateText}>{business.isPublished ? 'LIVE' : 'DRAFT'}</Text></View></View>
    <Text style={styles.sectionTitle}>Manage business</Text><View style={styles.grid}>{actions.map((item) => <Pressable key={item.label} onPress={item.action ?? (() => Alert.alert(item.label, 'This workspace section is next in the implementation plan.'))} style={styles.actionCard}><View style={styles.actionIcon}><Ionicons name={item.icon} size={22} color={colors.green} /></View><Text style={styles.actionText}>{item.label}</Text></Pressable>)}</View>
    {!hasPermission(role, 'business.profile.write') && <Text style={styles.readOnly}>Your {role} role has read-only access to the business profile.</Text>}
    <Pressable onPress={onSignOut} style={styles.signOut}><Ionicons name="log-out-outline" size={18} color={colors.orange} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
