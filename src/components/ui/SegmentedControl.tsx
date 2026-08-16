import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, touchTarget, typeScale } from '../../lib/design';

export type Segment<Value extends string> = { label: string; value: Value };

export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Segment<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <View accessibilityLabel={label} style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: palette.line,
  },
  segment: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  selected: { backgroundColor: palette.paper },
  text: { color: palette.muted, fontSize: typeScale.caption, fontWeight: '800' },
  selectedText: { color: palette.green },
});
