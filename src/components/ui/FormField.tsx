import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typeScale } from '../../lib/design';

type Props = PropsWithChildren<{
  label: string;
  hint?: string;
  error?: string;
}>;

export function FormField({ label, hint, error, children }: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  label: {
    fontSize: typeScale.overline,
    fontWeight: '800',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  hint: { fontSize: typeScale.overline, color: palette.muted },
  error: { fontSize: typeScale.caption, lineHeight: 18, color: palette.orange },
});
