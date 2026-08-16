import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { getBusinessEvents, saveEventMenuLink } from '../api';
import { rewardColors, rewardStyles as s } from '../styles';
import { EventChoice, MenuChoice } from '../types';

import { RewardHeader, RewardLoading } from './RewardUI';

export function EventMenuLinkForm({
  businessId,
  menu,
  onBack,
}: {
  businessId: string;
  menu: MenuChoice[];
  onBack: () => void;
}) {
  const [events, setEvents] = useState<EventChoice[]>([]);
  const [eventId, setEventId] = useState('');
  const [itemId, setItemId] = useState('');
  const [badge, setBadge] = useState('Event special');
  const [message, setMessage] = useState('Available for a limited time as part of this event.');
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [eventOnly, setEventOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getBusinessEvents(businessId)
      .then((data) => {
        setEvents(data);
        const first = data[0];
        if (first) {
          setEventId(first.id);
          setFrom(first.startsAt);
          setUntil(first.endsAt ?? new Date(new Date(first.startsAt).getTime() + 86_400_000).toISOString());
        }
      })
      .catch((error) => Alert.alert('Could not load events', error.message))
      .finally(() => setLoading(false));
  }, [businessId]);
  const choose = (event: EventChoice) => {
    setEventId(event.id);
    setFrom(event.startsAt);
    setUntil(event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 86_400_000).toISOString());
  };
  const submit = async () => {
    setBusy(true);
    try {
      await saveEventMenuLink({
        eventId,
        menuItemId: itemId,
        badge,
        message,
        availableFrom: from,
        availableUntil: until,
        eventOnly,
      });
      Alert.alert(
        'Event item linked',
        'The public menu will calculate its visibility from the event and availability window.',
      );
      onBack();
    } catch (caught) {
      Alert.alert('Could not link item', caught instanceof Error ? caught.message : 'Check the details.');
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <RewardHeader title="Link event item" onBack={onBack} />
        <RewardLoading />
      </ScrollView>
    );
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <RewardHeader title="Link event item" onBack={onBack} />
      <Text style={s.intro}>
        Event-only items disappear when the window ends or the event is cancelled. Regular items keep their
        menu listing but lose the badge.
      </Text>
      <Text style={s.sectionTitle}>Event</Text>
      <View style={s.wrap}>
        {events.map((event) => (
          <Chip
            key={event.id}
            label={event.title}
            active={eventId === event.id}
            onPress={() => choose(event)}
          />
        ))}
      </View>
      <Text style={s.sectionTitle}>Menu item</Text>
      <View style={s.wrap}>
        {menu.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            active={itemId === item.id}
            onPress={() => setItemId(item.id)}
          />
        ))}
      </View>
      <Field label="Badge" value={badge} onChangeText={setBadge} />
      <Field label="Customer message" value={message} onChangeText={setMessage} multiline />
      <Field label="Available from (ISO date/time)" value={from} onChangeText={setFrom} />
      <Field label="Available until (ISO date/time)" value={until} onChangeText={setUntil} />
      <View style={[s.card, s.row]}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Event-only item</Text>
          <Text style={s.meta}>Hide the item outside this window.</Text>
        </View>
        <Switch
          value={eventOnly}
          onValueChange={setEventOnly}
          trackColor={{ false: rewardColors.line, true: rewardColors.mint }}
          thumbColor={eventOnly ? rewardColors.green : rewardColors.muted}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={busy || !eventId || !itemId}
        onPress={submit}
        style={[s.primary, (busy || !eventId || !itemId) && s.disabled]}
      >
        <Text style={s.primaryText}>{busy ? 'Linking…' : 'Link item to event'}</Text>
      </Pressable>
    </ScrollView>
  );
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}
function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...input } = props;
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={rewardColors.muted}
        style={[s.field, input.multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        {...input}
      />
    </View>
  );
}
