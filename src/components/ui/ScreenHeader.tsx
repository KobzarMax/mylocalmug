import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, touchTarget, typeScale } from '../../lib/design';

import { IconButton } from './IconButton';

export function ScreenHeader({
  title,
  overline,
  onBack,
}: {
  title: string;
  overline?: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.row}>
      {onBack ? <IconButton icon="arrow-back" label="Go back" onPress={onBack} /> : null}
      <View style={styles.copy}>
        {overline ? <Text style={styles.overline}>{overline}</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      {onBack ? <View style={styles.placeholder} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1 },
  placeholder: { width: touchTarget },
  overline: { fontSize: typeScale.overline, fontWeight: '800', color: palette.orange, letterSpacing: 1.1 },
  title: { fontSize: 22, fontWeight: '800', color: palette.ink },
});
