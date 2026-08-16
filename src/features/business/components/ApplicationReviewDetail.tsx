import { useState } from 'react';
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

import { colors, styles } from '../styles';
import { ReviewApplication } from '../types';

import { ScreenHeader, SummaryRow } from './BusinessUI';

export function ApplicationReviewDetail({
  application,
  busy,
  onBack,
  onDecision,
}: {
  application: ReviewApplication;
  busy: boolean;
  onBack: () => void;
  onDecision: (approved: boolean, reason: string | null) => Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const decide = async (approved: boolean) => {
    if (!approved && reason.trim().length < 5) {
      Alert.alert('Add a reason', 'Explain what the business needs to change before resubmitting.');
      return;
    }
    try {
      await onDecision(approved, approved ? null : reason.trim());
      Alert.alert(
        approved ? 'Business approved' : 'Application rejected',
        approved ? 'The owner workspace is ready.' : 'The applicant can now update and resubmit.',
      );
    } catch (error) {
      Alert.alert('Review failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Review application" onBack={onBack} />
        <View style={styles.summaryCard}>
          <SummaryRow label="Trading name" value={application.tradingName} />
          <SummaryRow label="Legal name" value={application.legalName || 'Not provided'} />
          <SummaryRow label="Category" value={application.category} />
          <SummaryRow
            label="Submitted"
            value={
              application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Unknown'
            }
          />
        </View>
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>Business description</Text>
          <Text style={styles.detailText}>{application.description || 'No description provided.'}</Text>
        </View>
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>Contact and location</Text>
          <SummaryRow label="Address" value={application.address} />
          <SummaryRow label="Email" value={application.contactEmail} />
          <SummaryRow label="Phone" value={application.contactPhone || 'Not provided'} />
          <SummaryRow label="Website" value={application.websiteUrl || 'Not provided'} />
        </View>
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>Registration</Text>
          <SummaryRow label="Company number" value={application.companyNumber || 'Not provided'} />
          <SummaryRow label="VAT number" value={application.vatNumber || 'Not provided'} />
        </View>
        <Text style={styles.label}>Rejection reason</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Required only when rejecting"
          placeholderTextColor={colors.placeholder}
          multiline
          style={[styles.input, styles.multiline]}
        />
        <View style={styles.decisionRow}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => decide(false)}
            style={styles.rejectButton}
          >
            <Text style={styles.rejectText}>Request changes</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => decide(true)}
            style={styles.approveButton}
          >
            {busy ? (
              <ActivityIndicator color={colors.paper} />
            ) : (
              <Text style={styles.primaryText}>Approve</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
