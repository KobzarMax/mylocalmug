import React from 'react';
import { Text, TextInput, View } from 'react-native';

import { styles } from '../styles';

export function LegalFormField({
  label,
  value,
  onChangeText,
  disabled,
  keyboardType,
  autoCapitalize = 'sentences',
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  disabled: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  placeholder?: string;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        placeholder={placeholder}
        style={[styles.input, disabled && styles.disabled]}
      />
    </View>
  );
}
