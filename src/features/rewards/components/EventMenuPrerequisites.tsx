import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { rewardColors, rewardStyles as s } from '../styles';

export function EventMenuPrerequisites({
  hasEvents,
  hasMenuItems,
  onCreateEvent,
  onCreateMenuItem,
}: {
  hasEvents: boolean;
  hasMenuItems: boolean;
  onCreateEvent: () => void;
  onCreateMenuItem: () => void;
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Complete the prerequisites first</Text>
      <Text style={s.meta}>You need at least one event and one menu item before they can be linked.</Text>
      <PrerequisiteRow complete={hasEvents} label="Event created" />
      <PrerequisiteRow complete={hasMenuItems} label="Menu item created" />
      {!hasEvents ? (
        <Pressable accessibilityRole="button" onPress={onCreateEvent} style={s.primary}>
          <Text style={s.primaryText}>Create an event</Text>
        </Pressable>
      ) : null}
      {!hasMenuItems ? (
        <Pressable accessibilityRole="button" onPress={onCreateMenuItem} style={s.secondary}>
          <Text style={s.secondaryText}>Create a menu item</Text>
        </Pressable>
      ) : null}
      <Text style={s.meta}>Return here after creating the missing information.</Text>
    </View>
  );
}

function PrerequisiteRow({ complete, label }: { complete: boolean; label: string }) {
  return (
    <View accessibilityLabel={`${label}: ${complete ? 'complete' : 'required'}`} style={s.requirementRow}>
      <Ionicons
        name={complete ? 'checkmark-circle' : 'alert-circle-outline'}
        size={21}
        color={complete ? rewardColors.green : rewardColors.orange}
      />
      <Text style={s.requirementText}>{label}</Text>
      <Text style={complete ? s.requirementComplete : s.requirementMissing}>
        {complete ? 'Ready' : 'Required'}
      </Text>
    </View>
  );
}
