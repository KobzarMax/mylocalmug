import React, { useState } from 'react';
import { Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { ContentEditorInput, EventReminderOffset } from '../types';
import { REMINDER_OPTIONS } from '../validation';

type EventValueKey = 'eventStartsAt' | 'eventEndsAt';

export function EventFields({ form, disabled, update }: {
  form: ContentEditorInput;
  disabled: boolean;
  update: <Key extends keyof ContentEditorInput>(key: Key, value: ContentEditorInput[Key]) => void;
}) {
  const [picker, setPicker] = useState<{ field: EventValueKey; mode: 'date' | 'time' } | null>(null);
  const toggleAllDay = (value: boolean) => {
    update('eventAllDay', value);
    if (value && form.eventStartsAt) {
      const start = asUtcCalendarDate(new Date(form.eventStartsAt));
      update('eventStartsAt', start.toISOString());
      const end = form.eventEndsAt ? asUtcCalendarDate(new Date(form.eventEndsAt)) : new Date(start.getTime() + 86_400_000);
      update('eventEndsAt', (end <= start ? new Date(start.getTime() + 86_400_000) : end).toISOString());
    }
  };
  const toggleEnd = (enabled: boolean) => {
    if (!enabled) return update('eventEndsAt', null);
    const start = new Date(form.eventStartsAt ?? Date.now());
    update('eventEndsAt', new Date(start.getTime() + (form.eventAllDay ? 86_400_000 : 3_600_000)).toISOString());
  };
  const onDateChange = (event: DateTimePickerEvent, value?: Date) => {
    if (!picker) return;
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !value) return;
    update(picker.field, form.eventAllDay ? asUtcCalendarDate(value).toISOString() : value.toISOString());
  };
  const toggleReminder = (offset: EventReminderOffset) => update(
    'reminderMinutes',
    form.reminderMinutes.includes(offset)
      ? form.reminderMinutes.filter((value) => value !== offset)
      : [...form.reminderMinutes, offset],
  );

  return <View style={styles.sectionCard}>
    <Text style={styles.cardTitle}>Event details</Text>
    <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>All-day event</Text><Text style={styles.switchHint}>Use calendar dates without a specific start time.</Text></View><Switch value={form.eventAllDay} onValueChange={toggleAllDay} disabled={disabled} trackColor={{ false: '#D7CEC6', true: palette.mint }} thumbColor={form.eventAllDay ? palette.green : palette.muted} /></View>
    <DateField label="Starts" value={form.eventStartsAt} allDay={form.eventAllDay} disabled={disabled} onPick={(mode) => setPicker({ field: 'eventStartsAt', mode })} />
    <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>Add an end</Text><Text style={styles.switchHint}>Optional for timed events; all-day ends are exclusive.</Text></View><Switch value={Boolean(form.eventEndsAt)} onValueChange={toggleEnd} disabled={disabled} trackColor={{ false: '#D7CEC6', true: palette.mint }} thumbColor={form.eventEndsAt ? palette.green : palette.muted} /></View>
    {form.eventEndsAt && <DateField label="Ends" value={form.eventEndsAt} allDay={form.eventAllDay} disabled={disabled} onPick={(mode) => setPicker({ field: 'eventEndsAt', mode })} />}
    {picker && <DateTimePicker value={new Date(form[picker.field] ?? Date.now())} mode={picker.mode} display={Platform.OS === 'ios' ? 'compact' : 'default'} onChange={onDateChange} />}
    <Field label="Timezone" value={form.eventTimezone ?? ''} onChange={(value) => update('eventTimezone', value)} disabled={disabled} placeholder="Europe/London" />
    <Field label="Venue name" value={form.eventVenueName ?? ''} onChange={(value) => update('eventVenueName', value)} disabled={disabled} placeholder="Main coffee shop" />
    <Field label="Venue address" value={form.eventVenueAddress ?? ''} onChange={(value) => update('eventVenueAddress', value)} disabled={disabled} placeholder="Street address" multiline />
    <View style={styles.field}><Text style={styles.label}>Follower reminders</Text><View style={styles.wrap}>{REMINDER_OPTIONS.map((option) => {
      const active = form.reminderMinutes.includes(option.value);
      return <Pressable key={option.value} disabled={disabled} onPress={() => toggleReminder(option.value)} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label} before</Text></Pressable>;
    })}</View></View>
  </View>;
}

function DateField({ label, value, allDay, disabled, onPick }: { label: string; value: string | null; allDay: boolean; disabled: boolean; onPick: (mode: 'date' | 'time') => void }) {
  const date = value ? new Date(value) : null;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><View style={styles.row}>
    <Pressable disabled={disabled} onPress={() => onPick('date')} style={[styles.dateButton, { flex: 1 }]}><Ionicons name="calendar-outline" size={17} color={palette.green} /><Text style={styles.dateText}>{date ? date.toLocaleDateString(undefined, allDay ? { timeZone: 'UTC' } : undefined) : 'Choose date'}</Text></Pressable>
    {!allDay && <Pressable disabled={disabled} onPress={() => onPick('time')} style={[styles.dateButton, { flex: 1 }]}><Ionicons name="time-outline" size={17} color={palette.green} /><Text style={styles.dateText}>{date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Choose time'}</Text></Pressable>}
  </View></View>;
}

function asUtcCalendarDate(value: Date) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}

function Field({ label, value, onChange, disabled, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; placeholder: string; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} editable={!disabled} placeholder={placeholder} placeholderTextColor="#9B918A" multiline={multiline} style={[styles.input, multiline && styles.multiline]} /></View>;
}
