import { Text, TextInput } from 'react-native';

import { AppButton } from '../../../components/ui/AppButton';
import { FormField } from '../../../components/ui/FormField';
import { profileStyles as styles } from '../styles';

import { ProfileSection } from './ProfileSection';

type Props = {
  email: string;
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
  emailBusy: boolean;
  passwordBusy: boolean;
  setEmail: (value: string) => void;
  setCurrentPassword: (value: string) => void;
  setNextPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  onEmail: () => void;
  onPassword: () => void;
};

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label}>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChange}
        secureTextEntry
        style={styles.input}
        value={value}
      />
    </FormField>
  );
}

export function SecuritySections(props: Props) {
  return (
    <>
      <ProfileSection title="Email address">
        <FormField label="New email">
          <TextInput
            accessibilityLabel="New email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={props.setEmail}
            style={styles.input}
            value={props.email}
          />
        </FormField>
        <Text style={styles.help}>A confirmation link is required before the address changes.</Text>
        <AppButton
          busy={props.emailBusy}
          label="Request email change"
          onPress={props.onEmail}
          variant="secondary"
        />
      </ProfileSection>
      <ProfileSection title="Change password">
        <PasswordInput
          label="Current password"
          onChange={props.setCurrentPassword}
          value={props.currentPassword}
        />
        <PasswordInput label="New password" onChange={props.setNextPassword} value={props.nextPassword} />
        <PasswordInput
          label="Confirm new password"
          onChange={props.setConfirmPassword}
          value={props.confirmPassword}
        />
        <AppButton
          busy={props.passwordBusy}
          label="Change password"
          onPress={props.onPassword}
          variant="secondary"
        />
      </ProfileSection>
    </>
  );
}
