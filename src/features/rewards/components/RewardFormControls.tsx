import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { rewardColors, rewardStyles as s } from '../styles';

export function RewardChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
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

export function RewardField(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...input } = props;
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={rewardColors.muted}
        style={[s.field, input.multiline && { minHeight: 90, textAlignVertical: 'top' }]}
        {...input}
      />
    </View>
  );
}
