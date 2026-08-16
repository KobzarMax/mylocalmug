import { Text, View } from 'react-native';

import { styles } from '../styles';
import { PublicBusinessHour } from '../types';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function BusinessHours({ hours }: { hours: PublicBusinessHour[] }) {
  if (!hours.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>Opening hours</Text>
      {hours.map((hour) => (
        <View key={hour.dayOfWeek} style={styles.hoursRow}>
          <Text style={styles.hoursText}>{days[hour.dayOfWeek] ?? `Day ${hour.dayOfWeek + 1}`}</Text>
          <Text style={styles.hoursText}>
            {hour.isClosed ? 'Closed' : `${hour.opensAt ?? '—'}–${hour.closesAt ?? '—'}`}
          </Text>
        </View>
      ))}
    </View>
  );
}
