import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useBusinessApplication } from '../hooks';
import { colors, styles } from '../styles';
import { Application } from '../types';

import { FormField, ScreenHeader } from './BusinessUI';

export function BusinessApplicationForm({
  userId,
  initial,
  onBack,
  onChanged,
}: {
  userId: string;
  initial: Application;
  onBack: () => void;
  onChanged: () => void;
}) {
  const application = useBusinessApplication(userId, initial, onChanged);
  const run = async (action: () => Promise<void>, success?: string) => {
    try {
      await action();
      if (success) Alert.alert(success, 'You can return and continue later.');
    } catch (error) {
      Alert.alert('Could not save application', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Apply for business access" onBack={onBack} />
          <Text style={styles.lead}>
            Tell us about your coffee business. You can save a draft before submitting it for review.
          </Text>
          {initial.status === 'rejected' && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Changes requested</Text>
              <Text style={styles.warningText}>
                {initial.rejectionReason ?? 'Update the application and submit it again.'}
              </Text>
            </View>
          )}
          <FormField
            label="Trading name"
            value={application.form.tradingName}
            onChangeText={(v) => application.update('tradingName', v)}
            required
          />
          <FormField
            label="Legal name"
            value={application.form.legalName}
            onChangeText={(v) => application.update('legalName', v)}
          />
          <FormField
            label="Business category"
            value={application.form.category}
            onChangeText={(v) => application.update('category', v)}
            required
          />
          <FormField
            label="Description"
            value={application.form.description}
            onChangeText={(v) => application.update('description', v)}
            multiline
            maxLength={1000}
          />
          <FormField
            label="Business address"
            value={application.form.address}
            onChangeText={(v) => application.update('address', v)}
            multiline
            required
          />
          <FormField
            label="Contact email"
            value={application.form.contactEmail}
            onChangeText={(v) => application.update('contactEmail', v)}
            keyboardType="email-address"
            required
          />
          <FormField
            label="Contact phone"
            value={application.form.contactPhone}
            onChangeText={(v) => application.update('contactPhone', v)}
            keyboardType="phone-pad"
          />
          <FormField
            label="Website"
            value={application.form.websiteUrl}
            onChangeText={(v) => application.update('websiteUrl', v)}
            placeholder="https://"
            keyboardType="url"
          />
          <FormField
            label="Company number"
            value={application.form.companyNumber}
            onChangeText={(v) => application.update('companyNumber', v)}
          />
          <FormField
            label="VAT number"
            value={application.form.vatNumber}
            onChangeText={(v) => application.update('vatNumber', v)}
          />
          <Text style={styles.declaration}>
            By submitting, you confirm that you’re authorised to represent this business and that the
            information is accurate.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={application.busy}
            onPress={() => run(application.submit)}
            style={styles.primaryButton}
          >
            {application.busy ? (
              <ActivityIndicator color={colors.paper} />
            ) : (
              <Text style={styles.primaryText}>Submit for review</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={application.busy}
            onPress={() => run(application.saveDraft, 'Draft saved')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryText}>{application.lastSaved ? 'Draft saved' : 'Save draft'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
