import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typeScale } from '../../lib/design';

export function StatusChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <View
      accessibilityLabel={`Status: ${label}`}
      style={[styles.chip, tone === 'success' && styles.success, tone === 'warning' && styles.warning]}
    >
      <Text style={[styles.text, tone === 'warning' && styles.warningText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: palette.line,
  },
  success: { backgroundColor: palette.mint },
  warning: { backgroundColor: palette.warningPaper },
  text: { color: palette.green, fontSize: typeScale.overline, fontWeight: '900', textTransform: 'uppercase' },
  warningText: { color: palette.orange },
});
