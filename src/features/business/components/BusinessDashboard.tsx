import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

import { BusinessSetupItem } from '../dashboardHooks';
import { hasPermission } from '../permissions';
import { colors, styles } from '../styles';
import { Permission, Workspace } from '../types';

export function BusinessDashboard({
  workspace,
  displayName,
  onBack,
  onSignOut,
  onEditProfile,
  onOpenMenu,
  onOpenContent,
  onOpenRewards,
  onOpenTeam,
  onOpenLegal,
  onReviewApplications,
  setupItems,
  setupLoading,
}: {
  workspace: Workspace;
  displayName: string;
  onBack: () => void;
  onSignOut: () => void;
  onEditProfile: () => void;
  onOpenMenu: () => void;
  onOpenContent: () => void;
  onOpenRewards: () => void;
  onOpenTeam: () => void;
  onOpenLegal: () => void;
  onReviewApplications?: () => void;
  setupItems: BusinessSetupItem[];
  setupLoading: boolean;
}) {
  const { business, role } = workspace;
  const allActions: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    permission: Permission;
    action: () => void;
  }[] = [
    {
      icon: 'storefront-outline',
      label: 'Edit profile',
      permission: 'business.profile.write',
      action: onEditProfile,
    },
    { icon: 'restaurant-outline', label: 'Menu', permission: 'menu.manage', action: onOpenMenu },
    {
      icon: 'newspaper-outline',
      label: 'News & events',
      permission: 'content.manage',
      action: onOpenContent,
    },
    { icon: 'gift-outline', label: 'Rewards', permission: 'rewards.manage', action: onOpenRewards },
    { icon: 'people-outline', label: 'Team', permission: 'team.read', action: onOpenTeam },
    {
      icon: 'document-text-outline',
      label: 'Legal information',
      permission: 'legal.read',
      action: onOpenLegal,
    },
  ];
  const actions = allActions.filter((item) =>
    item.label === 'Rewards'
      ? hasPermission(role, 'rewards.manage') || hasPermission(role, 'loyalty.issue')
      : hasPermission(role, item.permission),
  );
  if (onReviewApplications)
    actions.push({
      icon: 'shield-checkmark-outline',
      label: 'Application reviews',
      permission: 'business.profile.write',
      action: onReviewApplications,
    });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to customer profile"
            onPress={onBack}
            style={styles.iconButton}
          >
            <Ionicons name="swap-horizontal" size={20} color={colors.green} />
          </Pressable>
          <View style={styles.topTitle}>
            <Text style={styles.overline}>{business.name}</Text>
            <Text style={styles.pageTitle}>Good morning, {displayName.split(' ')[0]}</Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>
        <LinearGradient colors={[colors.heroGreen, colors.heroGreenDark]} style={styles.hero}>
          <Text style={styles.heroOverline}>BUSINESS SETUP</Text>
          <Text style={styles.heroValue}>{setupLoading ? 'Checking setup…' : 'Your launch checklist'}</Text>
          {setupItems.map((item) => (
            <View key={item.key} style={styles.checkRow}>
              <Ionicons
                name={
                  item.state === 'complete'
                    ? 'checkmark-circle'
                    : item.state === 'unknown'
                      ? 'help-circle-outline'
                      : 'ellipse-outline'
                }
                size={18}
                color={item.state === 'complete' ? colors.mint : colors.paper}
              />
              <Text style={styles.heroHint}>{item.label}</Text>
            </View>
          ))}
        </LinearGradient>
        <View style={styles.stateCard}>
          <View>
            <Text style={styles.cardTitle}>Profile status</Text>
            <Text style={styles.cardText}>
              {business.status === 'active' ? 'Active' : 'Complete setup before publishing'}
            </Text>
          </View>
          <View style={[styles.statePill, business.isPublished && styles.livePill]}>
            <Text style={styles.stateText}>{business.isPublished ? 'LIVE' : 'DRAFT'}</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Manage business</Text>
        <View style={styles.grid}>
          {actions.map((item) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.label}
              key={item.label}
              onPress={item.action}
              style={styles.actionCard}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={item.icon} size={22} color={colors.green} />
              </View>
              <Text style={styles.actionText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        {!hasPermission(role, 'business.profile.write') && (
          <Text style={styles.readOnly}>Your {role} role has read-only access to the business profile.</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={onSignOut}
          style={styles.signOut}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.orange} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
