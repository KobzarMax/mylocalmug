import React from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApplicationReviews } from '../hooks';
import { colors, styles } from '../styles';
import { ApplicationReviewDetail } from './ApplicationReviewDetail';
import { PortalError, ScreenHeader } from './BusinessUI';

export function AdminReviewQueue({ onBack }: { onBack: () => void }) {
  const reviews = useApplicationReviews();
  if (reviews.error) return <PortalError message={reviews.error} onRetry={reviews.refresh} onBack={onBack} />;
  if (reviews.selected) return <ApplicationReviewDetail application={reviews.selected} busy={reviews.busy} onBack={() => reviews.setSelected(null)} onDecision={reviews.decide} />;

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <ScreenHeader title="Application reviews" onBack={onBack} />
    <View style={styles.adminIntro}><Text style={styles.adminIntroTitle}>Business access queue</Text><Text style={styles.adminIntroText}>Approval creates the private business workspace, owner membership, and primary location.</Text></View>
    {reviews.loading ? <ActivityIndicator color={colors.green} /> : reviews.applications.length === 0 ? <View style={styles.emptyCard}><Ionicons name="checkmark-circle-outline" size={34} color={colors.green} /><Text style={styles.statusTitle}>Queue is clear</Text><Text style={styles.statusText}>There are no submitted applications waiting for review.</Text></View> : reviews.applications.map((application) => <Pressable key={application.id} onPress={() => reviews.setSelected(application)} style={styles.reviewCard}><View style={styles.reviewCardTop}><Text style={styles.reviewName}>{application.tradingName}</Text><Text style={styles.reviewStatus}>{application.status.replace('_', ' ')}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></View><Text style={styles.reviewMeta}>{application.category} · {application.address}</Text></Pressable>)}
  </ScrollView></SafeAreaView>;
}
