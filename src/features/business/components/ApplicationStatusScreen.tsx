import React from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Application } from '../types';
import { colors, styles } from '../styles';
import { ScreenHeader, SummaryRow } from './BusinessUI';

export function ApplicationStatusScreen({ application, onBack, onRefresh }: { application: Application; onBack: () => void; onRefresh: () => void }) {
  const underReview = application.status === 'under_review';
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <ScreenHeader title="Business application" onBack={onBack} />
    <View style={styles.statusHero}>
      <View style={styles.statusIcon}><Ionicons name={underReview ? 'search' : application.status === 'approved' ? 'checkmark' : 'time'} size={28} color={colors.green} /></View>
      <Text style={styles.statusTitle}>{application.status === 'approved' ? 'Approved' : underReview ? 'Under review' : 'Application submitted'}</Text>
      <Text style={styles.statusText}>{application.status === 'approved' ? 'Your workspace is being prepared. Refresh in a moment.' : underReview ? 'We’re checking your business details. You’ll see the decision here.' : 'Your application is safely queued for review.'}</Text>
    </View>
    <View style={styles.summaryCard}><SummaryRow label="Business" value={application.tradingName} /><SummaryRow label="Address" value={application.address} /><SummaryRow label="Contact" value={application.contactEmail} /></View>
    <Pressable onPress={onRefresh} style={styles.primaryButton}><Text style={styles.primaryText}>Refresh status</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
