import { TextInput } from 'react-native';

import { AppButton } from '../../../components/ui/AppButton';
import { FormField } from '../../../components/ui/FormField';
import { PROFILE_DESCRIPTION_MAX_LENGTH } from '../../../lib/profileValidation';
import { profileStyles as styles } from '../styles';

import { ProfileSection } from './ProfileSection';

type Props = {
  displayName: string;
  description: string;
  busy: boolean;
  onDisplayNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
};

export function AboutProfileSection(props: Props) {
  return (
    <ProfileSection title="About you">
      <FormField label="Name">
        <TextInput
          accessibilityLabel="Name"
          autoCorrect={false}
          maxLength={80}
          onChangeText={props.onDisplayNameChange}
          style={styles.input}
          value={props.displayName}
        />
      </FormField>
      <FormField
        label="Short description"
        hint={`${props.description.length}/${PROFILE_DESCRIPTION_MAX_LENGTH}`}
      >
        <TextInput
          accessibilityLabel="Short description"
          maxLength={PROFILE_DESCRIPTION_MAX_LENGTH}
          multiline
          onChangeText={props.onDescriptionChange}
          placeholder="Tell local coffee people a little about you…"
          style={[styles.input, styles.multiline]}
          textAlignVertical="top"
          value={props.description}
        />
      </FormField>
      <AppButton busy={props.busy} label="Save profile" onPress={props.onSave} />
    </ProfileSection>
  );
}
