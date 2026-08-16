import { ChangeEvent, CSSProperties } from 'react';
import { Text, View } from 'react-native';

import { palette, radius, spacing } from '../../lib/design';

import { DateTimeFieldProps } from './DateTimeField.types';

const inputStyle: CSSProperties = {
  minHeight: 44,
  border: `1px solid ${palette.line}`,
  borderRadius: radius.md,
  padding: `0 ${spacing.md}px`,
  color: palette.ink,
  background: palette.paper,
  font: 'inherit',
};

export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const localValue = value ? toLocalInput(new Date(value)) : '';
  const change = (event: ChangeEvent<HTMLInputElement>) =>
    onChange(event.target.value ? new Date(event.target.value).toISOString() : '');
  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
      <Text style={{ color: palette.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
        {label}
      </Text>
      <input
        aria-label={label}
        onChange={change}
        style={inputStyle}
        type="datetime-local"
        value={localValue}
      />
      <Text style={{ color: palette.muted, fontSize: 12 }}>
        {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </Text>
    </View>
  );
}

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
