import { StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, typeScale } from '../../../lib/design';

export function RewardStepHeader({ current, labels }: { current: number; labels: string[] }) {
  return (
    <View
      accessibilityLabel={`Step ${current + 1} of ${labels.length}: ${labels[current]}`}
      style={styles.container}
    >
      <Text style={styles.overline}>
        Step {current + 1} of {labels.length}
      </Text>
      <Text accessibilityRole="header" style={styles.title}>
        {labels[current]}
      </Text>
      <View style={styles.track}>
        {labels.map((label, index) => (
          <View
            accessibilityLabel={label}
            key={label}
            style={[styles.segment, index <= current && styles.active]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: palette.mint },
  overline: {
    fontSize: typeScale.overline,
    fontWeight: '900',
    color: palette.green,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: typeScale.subtitle, fontWeight: '800', color: palette.ink },
  track: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 5, borderRadius: radius.round, backgroundColor: palette.paper },
  active: { backgroundColor: palette.green },
});
