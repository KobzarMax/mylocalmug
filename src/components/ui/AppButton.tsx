import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { palette, radius, spacing, touchTarget } from '../../lib/design';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  accessibilityHint?: string;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  busy = false,
  variant = 'primary',
  accessibilityHint,
}: Props) {
  const unavailable = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: unavailable, busy }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        unavailable && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? palette.paper : palette.green} />
      ) : (
        <Text style={[styles.text, variant !== 'primary' && styles.secondaryText]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.green,
  },
  secondary: { backgroundColor: palette.mint, borderWidth: 1, borderColor: palette.green },
  danger: { backgroundColor: palette.warningPaper, borderWidth: 1, borderColor: palette.orange },
  text: { color: palette.paper, fontSize: 14, fontWeight: '800' },
  secondaryText: { color: palette.green },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78 },
});
