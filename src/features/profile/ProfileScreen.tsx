import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppScreen } from '../../components/ui/AppScreen';
import { palette, radius, spacing, touchTarget, typeScale } from '../../lib/design';
import { getProfileAvatarUrl } from '../../lib/profileImage';

type Props = {
  displayName: string;
  email: string;
  description: string;
  avatarPath: string | null;
  onEdit: () => void;
  onBusiness: () => void;
  onSignOut: () => void;
};

export function ProfileScreen(props: Props) {
  const initials = props.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = getProfileAvatarUrl(props.avatarPath);
  return (
    <AppScreen>
      <Text style={styles.overline}>Your account</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {props.displayName}
      </Text>
      <AppCard>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.initials}>{initials || 'LM'}</Text>
            )}
          </View>
          <Text style={styles.email}>{props.email}</Text>
          {props.description ? (
            <Text style={styles.description}>{props.description}</Text>
          ) : (
            <Text style={styles.description}>Add a short introduction to your profile.</Text>
          )}
        </View>
      </AppCard>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
        onPress={props.onEdit}
        style={styles.row}
      >
        <Ionicons name="person-circle-outline" size={22} color={palette.green} />
        <Text style={styles.rowText}>Edit profile and security</Text>
        <Ionicons name="chevron-forward" size={19} color={palette.muted} />
      </Pressable>
      <View style={styles.actions}>
        <AppButton label="Open business portal" onPress={props.onBusiness} variant="secondary" />
        <AppButton label="Sign out" onPress={props.onSignOut} variant="danger" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  overline: {
    fontSize: typeScale.overline,
    fontWeight: '900',
    color: palette.orange,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    fontSize: typeScale.title,
    fontWeight: '800',
    color: palette.ink,
  },
  identity: { alignItems: 'center' },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mint,
  },
  avatarImage: { width: '100%', height: '100%' },
  initials: { fontSize: 28, fontWeight: '800', color: palette.green },
  email: { marginTop: spacing.md, fontSize: 14, color: palette.muted },
  description: {
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    color: palette.muted,
    textAlign: 'center',
  },
  row: {
    minHeight: touchTarget,
    marginTop: spacing.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
  },
  rowText: { flex: 1, fontSize: 14, fontWeight: '800', color: palette.ink },
  actions: { marginTop: spacing.xl, gap: spacing.md },
});
