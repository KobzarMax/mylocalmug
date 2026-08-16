import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { ContentEditorInput } from '../types';

type EventValueKey = 'eventStartsAt' | 'eventEndsAt';
type Props = {
  form: ContentEditorInput;
  disabled: boolean;
  update: <Key extends keyof ContentEditorInput>(key: Key, value: ContentEditorInput[Key]) => void;
};

export function EventScheduleFields({ form, disabled, update }: Props) {
  const [picker, setPicker] = useState<{ field: EventValueKey; mode: 'date' | 'time' } | null>(null);
  const toggleAllDay = (value: boolean) => {
    update('eventAllDay', value);
    if (!value || !form.eventStartsAt) return;
    const start = asUtcCalendarDate(new Date(form.eventStartsAt));
    const currentEnd = form.eventEndsAt ? asUtcCalendarDate(new Date(form.eventEndsAt)) : null;
    const end = currentEnd && currentEnd > start ? currentEnd : new Date(start.getTime() + 86_400_000);
    update('eventStartsAt', start.toISOString());
    update('eventEndsAt', end.toISOString());
  };
  const toggleEnd = (enabled: boolean) => {
    if (!enabled) return update('eventEndsAt', null);
    const start = new Date(form.eventStartsAt ?? Date.now());
    update(
      'eventEndsAt',
      new Date(start.getTime() + (form.eventAllDay ? 86_400_000 : 3_600_000)).toISOString(),
    );
  };
  const onDateChange = (event: DateTimePickerEvent, value?: Date) => {
    if (!picker) return;
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !value) return;
    update(picker.field, form.eventAllDay ? asUtcCalendarDate(value).toISOString() : value.toISOString());
  };

  return (
    <>
      <Toggle
        title="All-day event"
        hint="Use calendar dates without a specific start time."
        value={form.eventAllDay}
        disabled={disabled}
        onChange={toggleAllDay}
      />
      <DateField
        label="Starts"
        value={form.eventStartsAt}
        allDay={form.eventAllDay}
        disabled={disabled}
        onPick={(mode) => setPicker({ field: 'eventStartsAt', mode })}
      />
      <Toggle
        title="Add an end"
        hint="Optional for timed events; all-day ends are exclusive."
        value={Boolean(form.eventEndsAt)}
        disabled={disabled}
        onChange={toggleEnd}
      />
      {form.eventEndsAt ? (
        <DateField
          label="Ends"
          value={form.eventEndsAt}
          allDay={form.eventAllDay}
          disabled={disabled}
          onPick={(mode) => setPicker({ field: 'eventEndsAt', mode })}
        />
      ) : null}
      {picker ? (
        <DateTimePicker
          value={new Date(form[picker.field] ?? Date.now())}
          mode={picker.mode}
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={onDateChange}
        />
      ) : null}
    </>
  );
}

function Toggle({
  title,
  hint,
  value,
  disabled,
  onChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchHint}>{hint}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: palette.line, true: palette.mint }}
        thumbColor={value ? palette.green : palette.muted}
      />
    </View>
  );
}

function DateField({
  label,
  value,
  allDay,
  disabled,
  onPick,
}: {
  label: string;
  value: string | null;
  allDay: boolean;
  disabled: boolean;
  onPick: (mode: 'date' | 'time') => void;
}) {
  const date = value ? new Date(value) : null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <DateButton
          icon="calendar-outline"
          label={`${label} date`}
          disabled={disabled}
          onPress={() => onPick('date')}
        >
          {date
            ? date.toLocaleDateString(undefined, allDay ? { timeZone: 'UTC' } : undefined)
            : 'Choose date'}
        </DateButton>
        {!allDay ? (
          <DateButton
            icon="time-outline"
            label={`${label} time`}
            disabled={disabled}
            onPress={() => onPick('time')}
          >
            {date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Choose time'}
          </DateButton>
        ) : null}
      </View>
    </View>
  );
}

function DateButton({
  icon,
  label,
  disabled,
  onPress,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.dateButton, { flex: 1 }]}
    >
      <Ionicons name={icon} size={17} color={palette.green} />
      <Text style={styles.dateText}>{children}</Text>
    </Pressable>
  );
}

function asUtcCalendarDate(value: Date) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}
