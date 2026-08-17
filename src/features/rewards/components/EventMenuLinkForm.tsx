import React from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { DateTimeField } from '../../../components/ui/DateTimeField';
import { useEventMenuLinkForm } from '../eventMenuLinkHooks';
import { rewardColors, rewardStyles as s } from '../styles';
import { MenuChoice } from '../types';

import { EventMenuPrerequisites } from './EventMenuPrerequisites';
import { RewardError, RewardHeader, RewardLoading } from './RewardUI';

export function EventMenuLinkForm({
  businessId,
  menu,
  onBack,
  onCreateEvent,
  onCreateMenuItem,
}: {
  businessId: string;
  menu: MenuChoice[];
  onBack: () => void;
  onCreateEvent: () => void;
  onCreateMenuItem: () => void;
}) {
  const form = useEventMenuLinkForm(businessId, menu);
  if (form.loading)
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <RewardHeader title="Link event item" onBack={onBack} />
        <RewardLoading />
      </ScrollView>
    );
  if (form.error && !form.events.length)
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <RewardHeader title="Link event item" onBack={onBack} />
        <RewardError message={form.error} onRetry={form.retry} />
      </ScrollView>
    );
  if (form.complete)
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <RewardHeader title="Event item linked" onBack={onBack} />
        <View accessibilityLiveRegion="polite" style={s.card}>
          <Text style={s.cardTitle}>The link is ready</Text>
          <Text style={s.meta}>
            The public menu will calculate the item badge and visibility from the event and availability
            window.
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onBack} style={s.primary}>
          <Text style={s.primaryText}>Return to rewards</Text>
        </Pressable>
      </ScrollView>
    );
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <RewardHeader title="Link event item" onBack={onBack} />
      <Text style={s.intro}>
        Event-only items disappear when the window ends or the event is cancelled. Regular items keep their
        menu listing but lose the badge.
      </Text>
      {!form.events.length || !menu.length ? (
        <EventMenuPrerequisites
          hasEvents={form.events.length > 0}
          hasMenuItems={menu.length > 0}
          onCreateEvent={onCreateEvent}
          onCreateMenuItem={onCreateMenuItem}
        />
      ) : (
        <EventMenuLinkFields form={form} menu={menu} />
      )}
    </ScrollView>
  );
}

function EventMenuLinkFields({
  form,
  menu,
}: {
  form: ReturnType<typeof useEventMenuLinkForm>;
  menu: MenuChoice[];
}) {
  return (
    <>
      <Text style={s.sectionTitle}>Event</Text>
      <View style={s.wrap}>
        {form.events.map((event) => (
          <Chip
            key={event.id}
            label={event.title}
            active={form.eventId === event.id}
            onPress={() => form.chooseEvent(event)}
          />
        ))}
      </View>
      <Text style={s.sectionTitle}>Menu item</Text>
      <View style={s.wrap}>
        {menu.map((item) => (
          <Chip
            key={item.id}
            label={item.name}
            active={form.itemId === item.id}
            onPress={() => form.setItemId(item.id)}
          />
        ))}
      </View>
      <Field label="Badge" value={form.badge} onChangeText={form.setBadge} />
      <Field label="Customer message" value={form.message} onChangeText={form.setMessage} multiline />
      <DateTimeField
        label="Available from"
        optional={false}
        value={form.availableFrom}
        onChange={form.setAvailableFrom}
      />
      <DateTimeField
        label="Available until"
        optional={false}
        value={form.availableUntil}
        onChange={form.setAvailableUntil}
      />
      <View style={[s.card, s.row]}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>Event-only item</Text>
          <Text style={s.meta}>Hide the item outside this window.</Text>
        </View>
        <Switch
          accessibilityLabel="Event-only item"
          value={form.eventOnly}
          onValueChange={form.setEventOnly}
          trackColor={{ false: rewardColors.line, true: rewardColors.mint }}
          thumbColor={form.eventOnly ? rewardColors.green : rewardColors.muted}
        />
      </View>
      {form.error ? (
        <Text accessibilityLiveRegion="assertive" style={s.error}>
          {form.error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={form.busy || !form.eventId || !form.itemId}
        onPress={() => void form.submit()}
        style={[s.primary, (form.busy || !form.eventId || !form.itemId) && s.disabled]}
      >
        <Text style={s.primaryText}>{form.busy ? 'Linking…' : 'Link item to event'}</Text>
      </Pressable>
    </>
  );
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[s.chip, active && s.chipActive]}
    >
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
