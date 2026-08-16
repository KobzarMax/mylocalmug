import { Text, View } from 'react-native';

import { styles } from '../styles';
import { ContentEditorInput } from '../types';

import { EventScheduleFields } from './EventScheduleFields';
import { EventVenueFields } from './EventVenueFields';

export function EventFields({
  form,
  disabled,
  update,
}: {
  form: ContentEditorInput;
  disabled: boolean;
  update: <Key extends keyof ContentEditorInput>(key: Key, value: ContentEditorInput[Key]) => void;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.cardTitle}>Event details</Text>
      <EventScheduleFields form={form} disabled={disabled} update={update} />
      <EventVenueFields form={form} disabled={disabled} update={update} />
    </View>
  );
}
