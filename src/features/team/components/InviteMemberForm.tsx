import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';

import { palette } from '../../../lib/design';
import { useInviteMember } from '../hooks';
import { styles } from '../styles';
import { assignableRoles, CreatedInvitation } from '../types';

import { RoleOption, TeamHeader } from './TeamUI';

export function InviteMemberForm({
  businessId,
  roles,
  onBack,
  onCreated,
}: {
  businessId: string;
  roles: typeof assignableRoles;
  onBack: () => void;
  onCreated: (invitation: CreatedInvitation) => void;
}) {
  const form = useInviteMember(businessId);
  const submit = async () => {
    try {
      onCreated(await form.submit());
    } catch (error) {
      Alert.alert(
        'Could not create invitation',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TeamHeader title="Invite employee" onBack={onBack} />
          <Text style={styles.lead}>
            The invitation will only work for this email address and expires after seven days.
          </Text>
          <Text style={styles.label}>Employee email</Text>
          <TextInput
            accessibilityLabel="Employee email"
            value={form.email}
            onChangeText={form.setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="employee@example.com"
            placeholderTextColor={palette.placeholder}
            style={styles.input}
          />
          <Text style={styles.sectionTitle}>Access level</Text>
          {roles.map((role) => (
            <RoleOption
              key={role.value}
              label={role.label}
              description={role.description}
              active={form.role === role.value}
              onPress={() => form.setRole(role.value)}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            disabled={form.busy}
            onPress={submit}
            style={styles.primaryButton}
          >
            {form.busy ? (
              <ActivityIndicator color={palette.paper} />
            ) : (
              <Text style={styles.primaryText}>Create invitation</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
