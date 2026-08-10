import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { UserRole } from '../types';
import {
  createAvatarPath,
  getProfileAvatarUrl,
  inferProfileImageMime,
  PROFILE_IMAGE_BUCKET,
  validateProfileImageBytes,
  validateProfileImageMetadata,
} from '../lib/profileImage';
import {
  PROFILE_DESCRIPTION_MAX_LENGTH,
  profileEmailSchema,
  profilePasswordSchema,
  profileUpdateInputSchema,
  ProfileImageMime,
} from '../lib/profileValidation';
import { supabase } from '../lib/supabase';

const C = {
  ink: '#241A16',
  muted: '#766A63',
  cream: '#F7F2EA',
  paper: '#FFFDFC',
  green: '#235C4B',
  mint: '#DDEBE4',
  orange: '#D9773E',
  line: '#E9E0D7',
};

export type EditableProfile = {
  id: string;
  role: UserRole;
  display_name: string;
  description: string;
  avatar_path: string | null;
};

type CoffeeSpot = {
  id: string;
  name: string;
  address: string;
  logo_url: string | null;
};

type SelectedImage = {
  uri: string;
  mimeType: ProfileImageMime;
};

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
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [description, setDescription] = useState(profile.description);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [nextEmail, setNextEmail] = useState(email);
  const [emailBusy, setEmailBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [coffeeSpots, setCoffeeSpots] = useState<CoffeeSpot[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesUnavailable, setFavoritesUnavailable] = useState(false);

  const avatarUri = useMemo(
    () => selectedImage?.uri ?? getProfileAvatarUrl(profile.avatar_path),
    [profile.avatar_path, selectedImage],
  );

  useEffect(() => {
    let active = true;

    const loadCoffeeSpots = async () => {
      const [businessesResult, favoritesResult] = await Promise.all([
        supabase
          .from('businesses')
          .select('id, name, address, logo_url')
          .eq('is_published', true)
          .order('name'),
        supabase
          .from('favorite_businesses')
          .select('business_id')
          .eq('profile_id', profile.id),
      ]);

      if (!active) return;

      if (businessesResult.error || favoritesResult.error) {
        setFavoritesUnavailable(true);
      } else {
        setCoffeeSpots((businessesResult.data ?? []) as CoffeeSpot[]);
        setFavoriteIds(new Set((favoritesResult.data ?? []).map((item) => item.business_id as string)));
      }
      setFavoritesLoading(false);
    };

    loadCoffeeSpots();
    return () => {
      active = false;
    };
  }, [profile.id]);

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    try {
      const asset = result.assets[0];
      const mimeType = inferProfileImageMime(asset.mimeType, asset.fileName ?? asset.uri);
      if (!mimeType) {
        throw new Error('Choose a JPEG, PNG, or WebP image. SVG and other file types are blocked.');
      }

      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      validateProfileImageMetadata(mimeType, bytes.byteLength);
      validateProfileImageBytes(bytes, mimeType);
      setSelectedImage({ uri: asset.uri, mimeType });
    } catch (error) {
      Alert.alert('Photo not accepted', error instanceof Error ? error.message : 'Choose another image.');
    }
  };

  const saveProfile = async () => {
    const parsed = profileUpdateInputSchema.safeParse({
      displayName,
      description,
      avatarPath: profile.avatar_path,
    });

    if (!parsed.success) {
      Alert.alert('Check your profile', parsed.error.issues[0]?.message ?? 'Profile details are invalid.');
      return;
    }

    setProfileBusy(true);
    let uploadedPath: string | null = null;

    try {
      let avatarPath = profile.avatar_path;

      if (selectedImage) {
        const response = await fetch(selectedImage.uri);
        const bytes = await response.arrayBuffer();
        validateProfileImageMetadata(selectedImage.mimeType, bytes.byteLength);
        validateProfileImageBytes(bytes, selectedImage.mimeType);

        uploadedPath = createAvatarPath(profile.id, selectedImage.mimeType);
        const { error: uploadError } = await supabase.storage
          .from(PROFILE_IMAGE_BUCKET)
          .upload(uploadedPath, bytes, {
            contentType: selectedImage.mimeType,
            upsert: false,
          });

        if (uploadError) throw uploadError;
        avatarPath = uploadedPath;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: parsed.data.displayName,
          description: parsed.data.description,
          avatar_path: avatarPath,
        })
        .eq('id', profile.id)
        .select('id, role, display_name, description, avatar_path')
        .single();

      if (error) throw error;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { display_name: parsed.data.displayName },
      });
      if (metadataError) console.warn('Auth display name metadata was not updated:', metadataError.message);

      if (uploadedPath && profile.avatar_path && uploadedPath !== profile.avatar_path) {
        await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([profile.avatar_path]);
      }

      setSelectedImage(null);
      onSaved(data as EditableProfile);
      Alert.alert('Profile updated', 'Your profile changes have been saved.');
    } catch (error) {
      if (uploadedPath) await supabase.storage.from(PROFILE_IMAGE_BUCKET).remove([uploadedPath]);
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setProfileBusy(false);
    }
  };

  const requestEmailChange = async () => {
    const parsed = profileEmailSchema.safeParse(nextEmail);
    if (!parsed.success) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    if (parsed.data === email.toLowerCase()) {
      Alert.alert('Email unchanged', 'Enter a different email address.');
      return;
    }

    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser({ email: parsed.data });
    setEmailBusy(false);

    if (error) {
      Alert.alert('Could not change email', error.message);
      return;
    }

    Alert.alert(
      'Confirm your new email',
      'Supabase has sent the required confirmation link. Your current email remains active until confirmation completes.',
    );
  };

  const changePassword = async () => {
    const parsed = profilePasswordSchema.safeParse(nextPassword);
    if (!currentPassword || !parsed.success) {
      Alert.alert('Check your password', 'Enter your current password and a new password of at least 8 characters.');
      return;
    }
    if (nextPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Re-enter the same new password.');
      return;
    }

    setPasswordBusy(true);
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reauthError) {
      setPasswordBusy(false);
      Alert.alert('Current password is incorrect', reauthError.message);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setPasswordBusy(false);

    if (error) {
      Alert.alert('Could not change password', error.message);
      return;
    }

    setCurrentPassword('');
    setNextPassword('');
    setConfirmPassword('');
    Alert.alert('Password changed', 'Your new password is active.');
  };

  const toggleFavorite = async (businessId: string) => {
    const wasFavorite = favoriteIds.has(businessId);
    const next = new Set(favoriteIds);
    wasFavorite ? next.delete(businessId) : next.add(businessId);
    setFavoriteIds(next);

    const result = wasFavorite
      ? await supabase
          .from('favorite_businesses')
          .delete()
          .eq('profile_id', profile.id)
          .eq('business_id', businessId)
      : await supabase
          .from('favorite_businesses')
          .insert({ profile_id: profile.id, business_id: businessId });

    if (result.error) {
      setFavoriteIds(favoriteIds);
      Alert.alert('Could not update favourites', result.error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable style={styles.iconButton} onPress={onBack}>
              <Ionicons name="chevron-back" size={22} color={C.ink} />
            </Pressable>
            <Text style={styles.title}>Edit profile</Text>
            <View style={styles.iconPlaceholder} />
          </View>

          <View style={styles.photoSection}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{profile.display_name.slice(0, 2).toUpperCase()}</Text>
              )}
            </View>
            <Pressable style={styles.photoButton} onPress={choosePhoto}>
              <Ionicons name="camera-outline" size={17} color={C.green} />
              <Text style={styles.photoButtonText}>Choose photo</Text>
            </Pressable>
            <Text style={styles.fileHint}>JPEG, PNG or WebP · maximum 5 MB</Text>
          </View>

          <Section title="About you">
            <Field label="Name">
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={80}
                autoCorrect={false}
                style={styles.input}
              />
            </Field>
            <Field label="Short description" hint={`${description.length}/${PROFILE_DESCRIPTION_MAX_LENGTH}`}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={PROFILE_DESCRIPTION_MAX_LENGTH}
                multiline
                textAlignVertical="top"
                placeholder="Tell local coffee people a little about you…"
                placeholderTextColor="#9B918A"
                style={[styles.input, styles.multiline]}
              />
            </Field>
            <PrimaryButton label="Save profile" busy={profileBusy} onPress={saveProfile} />
          </Section>

          <Section title="Favourite coffee spots">
            {favoritesLoading ? (
              <ActivityIndicator color={C.green} />
            ) : favoritesUnavailable ? (
              <Text style={styles.helpText}>Coffee spots will be available after the database migration is applied.</Text>
            ) : coffeeSpots.length === 0 ? (
              <Text style={styles.helpText}>No published coffee shops are available yet.</Text>
            ) : (
              coffeeSpots.map((spot) => {
                const selected = favoriteIds.has(spot.id);
                return (
                  <Pressable key={spot.id} style={styles.spotRow} onPress={() => toggleFavorite(spot.id)}>
                    <View style={[styles.spotLogo, selected && styles.spotLogoSelected]}>
                      <Ionicons name="cafe" size={18} color={selected ? C.paper : C.green} />
                    </View>
                    <View style={styles.spotCopy}>
                      <Text style={styles.spotName}>{spot.name}</Text>
                      <Text style={styles.helpText} numberOfLines={1}>{spot.address}</Text>
                    </View>
                    <Ionicons name={selected ? 'heart' : 'heart-outline'} size={22} color={selected ? C.orange : C.muted} />
                  </Pressable>
                );
              })
            )}
          </Section>

          <Section title="Email address">
            <Field label="New email">
              <TextInput
                value={nextEmail}
                onChangeText={setNextEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
            </Field>
            <Text style={styles.helpText}>A confirmation link is required before the address changes.</Text>
            <PrimaryButton label="Request email change" busy={emailBusy} onPress={requestEmailChange} secondary />
          </Section>

          <Section title="Change password">
            <PasswordField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
            <PasswordField label="New password" value={nextPassword} onChangeText={setNextPassword} />
            <PasswordField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
            <PrimaryButton label="Change password" busy={passwordBusy} onPress={changePassword} secondary />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function PasswordField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <Field label={label}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        style={styles.input}
      />
    </Field>
  );
}

function PrimaryButton({
  label,
  busy,
  onPress,
  secondary = false,
}: {
  label: string;
  busy: boolean;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable disabled={busy} onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary, busy && styles.disabled]}>
      {busy ? (
        <ActivityIndicator color={secondary ? C.green : C.paper} />
      ) : (
        <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  iconPlaceholder: { width: 40 },
  title: { fontSize: 20, fontWeight: '800', color: C.ink },
  photoSection: { alignItems: 'center', paddingVertical: 18 },
  avatar: { width: 104, height: 104, borderRadius: 36, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: C.paper },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: C.green },
  photoButton: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: C.mint },
  photoButtonText: { fontSize: 13, fontWeight: '800', color: C.green },
  fileHint: { marginTop: 8, fontSize: 11, color: C.muted },
  section: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  sectionTitle: { marginBottom: 12, fontSize: 17, fontWeight: '800', color: C.ink },
  field: { marginBottom: 13 },
  labelRow: { marginBottom: 7, flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.7 },
  hint: { fontSize: 11, color: C.muted },
  input: { minHeight: 50, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 14, fontSize: 15, color: C.ink, backgroundColor: '#FFFEFC' },
  multiline: { minHeight: 108, paddingTop: 13, paddingBottom: 13 },
  helpText: { fontSize: 12, lineHeight: 18, color: C.muted },
  button: { minHeight: 50, marginTop: 4, borderRadius: 14, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  buttonSecondary: { backgroundColor: C.mint },
  buttonText: { fontSize: 14, fontWeight: '800', color: C.paper },
  buttonTextSecondary: { color: C.green },
  disabled: { opacity: 0.55 },
  spotRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 10 },
  spotLogo: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.mint },
  spotLogoSelected: { backgroundColor: C.green },
  spotCopy: { flex: 1, marginHorizontal: 11 },
  spotName: { fontSize: 14, fontWeight: '800', color: C.ink },
});
