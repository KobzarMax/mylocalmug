import { Ionicons } from '@expo/vector-icons';
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

import { palette } from '../../lib/design';
import { Workspace } from '../business/types';

import { AddressSection } from './components/AddressSection';
import { ContactSection } from './components/ContactSection';
import { EntitySection } from './components/EntitySection';
import { LegalActions } from './components/LegalActions';
import { LegalStatusCard } from './components/LegalStatusCard';
import { RegistrationSection } from './components/RegistrationSection';
import { useLegalProfile } from './hooks';
import { styles } from './styles';

export function LegalEntry({ workspace, onBack }: { workspace: Workspace; onBack: () => void }) {
  const legal = useLegalProfile(workspace);
  const run = (operation: () => Promise<unknown>) =>
    void operation().catch((caught) =>
      Alert.alert(
        'Legal profile',
        caught instanceof Error ? caught.message : 'Could not complete that action.',
      ),
    );
  if (legal.loading)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.state}>
          <ActivityIndicator color={palette.green} />
          <Text style={styles.stateText}>Loading private legal information…</Text>
        </View>
      </SafeAreaView>
    );
  if (!legal.profile || !legal.form)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.state}>
          <Ionicons name="alert-circle-outline" size={34} color={palette.orange} />
          <Text style={styles.stateText}>{legal.error ?? 'Legal information is unavailable.'}</Text>
          <Pressable accessibilityRole="button" onPress={() => void legal.refresh()} style={styles.action}>
            <Text style={styles.actionText}>Try again</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onBack} style={[styles.action, styles.secondary]}>
            <Text style={[styles.actionText, styles.secondaryText]}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  const locked = !legal.canWrite || legal.profile.status === 'pending_approval' || legal.busy;
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onBack}
              style={styles.back}
            >
              <Ionicons name="arrow-back" size={22} color={palette.green} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.overline}>Business compliance · United Kingdom</Text>
              <Text style={styles.title}>Legal information</Text>
            </View>
          </View>
          <Text style={styles.intro}>
            Local Mug stores only ordinary business identity details. Payment providers will collect bank,
            representative, ownership, and identity-verification information securely during onboarding.
          </Text>
          <LegalStatusCard profile={legal.profile} />
          {legal.error && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Could not continue</Text>
              <Text style={styles.warningText}>{legal.error}</Text>
              <Pressable
                accessibilityRole="button"
                disabled={legal.busy}
                onPress={() => void legal.refresh()}
                style={[styles.action, styles.secondary]}
              >
                <Text style={[styles.actionText, styles.secondaryText]}>Refresh legal profile</Text>
              </Pressable>
            </View>
          )}
          <EntitySection form={legal.form} disabled={locked} update={legal.update} />
          <AddressSection form={legal.form} disabled={locked} update={legal.update} />
          <RegistrationSection form={legal.form} disabled={locked} update={legal.update} />
          <ContactSection form={legal.form} disabled={locked} update={legal.update} />
          <LegalActions
            profile={legal.profile}
            canWrite={legal.canWrite}
            canApprove={legal.canApprove}
            busy={legal.busy}
            dirty={legal.dirty}
            onSave={() => run(legal.save)}
            onSubmit={() => run(legal.submit)}
            onApprove={() => run(legal.approve)}
            onRequestChanges={(note) => run(() => legal.requestChanges(note))}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
