import { KeyboardAvoidingView, Platform, Text } from 'react-native';

import { AppScreen } from '../../components/ui/AppScreen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

import { AboutProfileSection } from './components/AboutProfileSection';
import { FavoriteCoffeeSpots } from './components/FavoriteCoffeeSpots';
import { ProfilePhotoSection } from './components/ProfilePhotoSection';
import { SecuritySections } from './components/SecuritySections';
import { useProfileEditor } from './hooks';
import { profileStyles as styles } from './styles';
import { EditableProfile } from './types';

export function EditProfileScreen({
  profile,
  email,
  onBack,
  onSaved,
}: {
  profile: EditableProfile;
  email: string;
  onBack: () => void;
  onSaved: (profile: EditableProfile) => void;
}) {
  const editor = useProfileEditor({ profile, email, onSaved });
  const { values, setters } = editor;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
      <AppScreen contentStyle={styles.content}>
        <ScreenHeader onBack={onBack} title="Edit profile" />
        {editor.notice ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole={editor.notice.tone === 'error' ? 'alert' : undefined}
            style={[
              styles.notice,
              editor.notice.tone === 'error' ? styles.noticeError : styles.noticeSuccess,
              styles.noticeText,
            ]}
          >
            {editor.notice.message}
          </Text>
        ) : null}
        <ProfilePhotoSection
          avatarUri={editor.avatarUri}
          displayName={values.displayName}
          onChoose={() => void editor.choosePhoto()}
        />
        <AboutProfileSection
          busy={editor.profileBusy}
          description={values.description}
          displayName={values.displayName}
          onDescriptionChange={setters.setDescription}
          onDisplayNameChange={setters.setDisplayName}
          onSave={editor.saveProfile}
        />
        <FavoriteCoffeeSpots
          error={editor.coffeeSpots.isError}
          favoriteIds={editor.coffeeSpots.data?.favoriteIds ?? []}
          loading={editor.coffeeSpots.isLoading}
          onToggle={editor.toggleFavorite}
          spots={editor.coffeeSpots.data?.spots ?? []}
        />
        <SecuritySections
          confirmPassword={values.confirmPassword}
          currentPassword={values.currentPassword}
          email={values.nextEmail}
          emailBusy={editor.emailBusy}
          nextPassword={values.nextPassword}
          onEmail={editor.requestEmailChange}
          onPassword={editor.changePassword}
          passwordBusy={editor.passwordBusy}
          setConfirmPassword={setters.setConfirmPassword}
          setCurrentPassword={setters.setCurrentPassword}
          setEmail={setters.setNextEmail}
          setNextPassword={setters.setNextPassword}
        />
      </AppScreen>
    </KeyboardAvoidingView>
  );
}
