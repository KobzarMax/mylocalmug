import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useBusinessProfile } from '../hooks';
import { hasPermission } from '../permissions';
import { colors, styles } from '../styles';
import { DAYS, Workspace } from '../types';

import { FormField, ScreenHeader } from './BusinessUI';

export function BusinessProfileEditor({
  workspace,
  onBack,
  onSaved,
}: {
  workspace: Workspace;
  onBack: () => void;
  onSaved: () => void;
}) {
  const profile = useBusinessProfile(workspace, onSaved);
  const editable = hasPermission(workspace.role, 'business.profile.write');
  const save = async () => {
    try {
      await profile.save();
      Alert.alert(
        'Business profile saved',
        profile.published
          ? 'Your latest profile is visible to customers.'
          : 'Your draft changes have been saved.',
      );
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const pickMedia = async (kind: 'logo' | 'header') => {
    try {
      await profile.pickMedia(kind);
    } catch (error) {
      Alert.alert('Image not accepted', error instanceof Error ? error.message : 'Choose another image.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Business profile" onBack={onBack} />
          <Text style={styles.lead}>This information becomes your customer-facing coffee shop profile.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change business cover image"
            disabled={!editable}
            onPress={() => pickMedia('header')}
            style={styles.headerMedia}
          >
            {profile.header?.uri || workspace.business.headerUrl ? (
              <Image
                source={{ uri: profile.header?.uri ?? workspace.business.headerUrl ?? '' }}
                style={styles.mediaImage}
              />
            ) : (
              <Ionicons name="image-outline" size={30} color={colors.green} />
            )}
            {editable && (
              <View style={styles.mediaBadge}>
                <Text style={styles.mediaBadgeText}>Change cover</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change business logo"
            disabled={!editable}
            onPress={() => pickMedia('logo')}
            style={styles.logoMedia}
          >
            {profile.logo?.uri || workspace.business.logoUrl ? (
              <Image
                source={{ uri: profile.logo?.uri ?? workspace.business.logoUrl ?? '' }}
                style={styles.mediaImage}
              />
            ) : (
              <Ionicons name="storefront-outline" size={28} color={colors.green} />
            )}
            {editable && (
              <View style={styles.logoEdit}>
                <Ionicons name="camera" size={14} color={colors.paper} />
              </View>
            )}
          </Pressable>
          <FormField
            label="Business name"
            value={profile.form.name}
            onChangeText={(v) => profile.update('name', v)}
            editable={editable}
            required
          />
          <FormField
            label="Category"
            value={profile.form.category}
            onChangeText={(v) => profile.update('category', v)}
            editable={editable}
            required
          />
          <FormField
            label="Description"
            value={profile.form.description}
            onChangeText={(v) => profile.update('description', v)}
            editable={editable}
            multiline
            maxLength={1000}
          />
          <FormField
            label="Address"
            value={profile.form.address}
            onChangeText={(v) => profile.update('address', v)}
            editable={editable}
            multiline
            required
          />
          <FormField
            label="Public email"
            value={profile.form.contactEmail}
            onChangeText={(v) => profile.update('contactEmail', v)}
            editable={editable}
            keyboardType="email-address"
            required
          />
          <FormField
            label="Public phone"
            value={profile.form.contactPhone}
            onChangeText={(v) => profile.update('contactPhone', v)}
            editable={editable}
            keyboardType="phone-pad"
          />
          <FormField
            label="Website"
            value={profile.form.websiteUrl}
            onChangeText={(v) => profile.update('websiteUrl', v)}
            editable={editable}
            keyboardType="url"
            placeholder="https://"
          />
          <Text style={styles.sectionTitle}>Opening hours</Text>
          {profile.hoursLoading ? (
            <ActivityIndicator color={colors.green} />
          ) : (
            profile.hours.map((day, index) => (
              <View key={day.dayOfWeek} style={styles.hoursRow}>
                <View style={styles.hoursDay}>
                  <Text style={styles.cardTitle}>{DAYS[day.dayOfWeek]}</Text>
                  <Text style={styles.cardText}>
                    {day.isClosed ? 'Closed' : `${day.opensAt}–${day.closesAt}`}
                  </Text>
                </View>
                {!day.isClosed && (
                  <View style={styles.timeInputs}>
                    <TextInput
                      editable={editable}
                      value={day.opensAt}
                      maxLength={5}
                      onChangeText={(value) => profile.updateHours(index, { opensAt: value })}
                      style={styles.timeInput}
                    />
                    <Text style={styles.timeDash}>–</Text>
                    <TextInput
                      editable={editable}
                      value={day.closesAt}
                      maxLength={5}
                      onChangeText={(value) => profile.updateHours(index, { closesAt: value })}
                      style={styles.timeInput}
                    />
                  </View>
                )}
                <Switch
                  disabled={!editable}
                  value={!day.isClosed}
                  onValueChange={(open) => profile.updateHours(index, { isClosed: !open })}
                  trackColor={{ false: colors.line, true: colors.green }}
                />
              </View>
            ))
          )}
          {editable && (
            <View style={styles.publishRow}>
              <View style={styles.publishCopy}>
                <Text style={styles.cardTitle}>Publish profile</Text>
                <Text style={styles.cardText}>Make this business visible in customer discovery.</Text>
              </View>
              <Switch
                value={profile.published}
                onValueChange={profile.setPublished}
                trackColor={{ false: colors.line, true: colors.green }}
              />
            </View>
          )}
          {editable && (
            <Pressable
              accessibilityRole="button"
              disabled={profile.busy}
              onPress={save}
              style={styles.primaryButton}
            >
              {profile.busy ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={styles.primaryText}>Save business profile</Text>
              )}
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
