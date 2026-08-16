import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { palette } from '../../../lib/design';
import { styles } from '../styles';

export function PublicationActions({
  busy,
  alreadyPublished,
  hasPublication = false,
  onSave,
}: {
  busy: boolean;
  alreadyPublished: boolean;
  hasPublication?: boolean;
  onSave: (mode: 'draft' | 'publish' | 'schedule', date?: Date) => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(() => new Date(Date.now() + 3_600_000));
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  return (
    <View style={{ marginTop: 20 }}>
      {showSchedule && !alreadyPublished && (
        <View style={styles.sectionCard}>
          <Text style={styles.label}>Publish on</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerMode('date')}
              style={styles.dateButton}
            >
              <Text style={styles.dateText}>{scheduledFor.toLocaleDateString()}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerMode('time')}
              style={styles.dateButton}
            >
              <Text style={styles.dateText}>
                {scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
          </View>
          {pickerMode && (
            <DateTimePicker
              value={scheduledFor}
              mode={pickerMode}
              minimumDate={new Date()}
              display={Platform.OS === 'ios' ? 'compact' : 'default'}
              onChange={(event, value) => {
                if (value) setScheduledFor(value);
                if (Platform.OS === 'android' || event.type === 'dismissed') setPickerMode(null);
              }}
            />
          )}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onSave('schedule', scheduledFor)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Confirm schedule</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => onSave('draft')}
          style={[styles.secondaryButton, busy && styles.disabled]}
        >
          <Text style={styles.secondaryText}>
            {alreadyPublished || hasPublication ? 'Save changes' : 'Save draft'}
          </Text>
        </Pressable>
        {!alreadyPublished && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onSave('publish')}
            style={[styles.primaryButton, busy && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color={palette.paper} />
            ) : (
              <Text style={styles.primaryText}>Publish now</Text>
            )}
          </Pressable>
        )}
      </View>
      {!alreadyPublished && (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => setShowSchedule((value) => !value)}
          style={[styles.secondaryButton, busy && styles.disabled]}
        >
          <Text style={styles.secondaryText}>
            {showSchedule ? 'Hide scheduling' : 'Schedule publication'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
