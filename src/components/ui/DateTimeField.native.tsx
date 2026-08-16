import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radius, spacing, touchTarget, typeScale } from '../../lib/design';

import { DateTimeFieldProps } from './DateTimeField.types';

export function DateTimeField({ label, value, onChange, optional = true }: DateTimeFieldProps) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const date = value ? new Date(value) : new Date();
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const commit = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) return setMode(null);
    onChange(selected.toISOString());
    if (Platform.OS === 'android' && mode === 'date') setMode('time');
    else setMode(null);
  };
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${value ? validDate.toLocaleString() : 'not set'}`}
          onPress={() => setMode(Platform.OS === 'ios' ? 'date' : 'date')}
          style={({ pressed }) => [styles.control, pressed && styles.pressed]}
        >
          <Text style={styles.value}>{value ? validDate.toLocaleString() : 'Choose date and time'}</Text>
        </Pressable>
        {optional && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            onPress={() => onChange('')}
            style={styles.clear}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.hint}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</Text>
      {mode ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          mode={Platform.OS === 'ios' ? 'datetime' : mode}
          onChange={commit}
          value={validDate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm, marginTop: spacing.md },
  label: {
    fontSize: typeScale.overline,
    fontWeight: '800',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  control: {
    flex: 1,
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radius.md,
    backgroundColor: palette.paper,
  },
  value: { fontSize: typeScale.body, color: palette.ink },
  clear: { minHeight: touchTarget, justifyContent: 'center', paddingHorizontal: spacing.md },
  clearText: { color: palette.orange, fontWeight: '700' },
  hint: { fontSize: typeScale.caption, color: palette.muted },
  pressed: { opacity: 0.75 },
});
