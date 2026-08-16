import { Pressable, Text, TextInput, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { ContentEditorInput, EventReminderOffset } from '../types';
import { REMINDER_OPTIONS } from '../validation';

type Props = {
  form: ContentEditorInput;
  disabled: boolean;
  update: <Key extends keyof ContentEditorInput>(key: Key, value: ContentEditorInput[Key]) => void;
};

export function EventVenueFields({ form, disabled, update }: Props) {
  const toggleReminder = (offset: EventReminderOffset) =>
    update(
      'reminderMinutes',
      form.reminderMinutes.includes(offset)
        ? form.reminderMinutes.filter((value) => value !== offset)
        : [...form.reminderMinutes, offset],
    );
  return (
    <>
      <Field
        label="Timezone"
        value={form.eventTimezone ?? ''}
        onChange={(value) => update('eventTimezone', value)}
        disabled={disabled}
        placeholder="Europe/London"
      />
      <Field
        label="Venue name"
        value={form.eventVenueName ?? ''}
        onChange={(value) => update('eventVenueName', value)}
        disabled={disabled}
        placeholder="Main coffee shop"
      />
      <Field
        label="Venue address"
        value={form.eventVenueAddress ?? ''}
        onChange={(value) => update('eventVenueAddress', value)}
        disabled={disabled}
        placeholder="Street address"
        multiline
      />
      <View style={styles.field}>
        <Text style={styles.label}>Follower reminders</Text>
        <View style={styles.wrap}>
          {REMINDER_OPTIONS.map((option) => {
            const active = form.reminderMinutes.includes(option.value);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled }}
                key={option.value}
                disabled={disabled}
                onPress={() => toggleReminder(option.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label} before</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}
