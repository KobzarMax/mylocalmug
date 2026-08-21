import { Text, View } from 'react-native';

import { ResolvedBusinessTheme } from '../../branding/types';
import { styles } from '../styles';
import { PublicBusinessHour } from '../types';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function BusinessHours({
  hours,
  theme,
}: {
  hours: PublicBusinessHour[];
  theme: ResolvedBusinessTheme;
}) {
  if (!hours.length) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Opening hours</Text>
      {hours.map((hour) => (
        <View key={hour.dayOfWeek} style={[styles.hoursRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.hoursText, { color: theme.mutedText }]}>
            {days[hour.dayOfWeek] ?? `Day ${hour.dayOfWeek + 1}`}
          </Text>
          <Text style={[styles.hoursText, { color: theme.mutedText }]}>
            {hour.isClosed ? 'Closed' : `${hour.opensAt ?? '—'}–${hour.closesAt ?? '—'}`}
          </Text>
        </View>
      ))}
    </View>
  );
}
