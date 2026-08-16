import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';

import { colors, styles } from '../styles';

export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={styles.iconButton}
      >
        <Ionicons name="arrow-back" size={21} color={colors.green} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.iconSpacer} />
    </View>
  );
}

export function FormField({
  label,
  required,
  multiline,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; required?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        autoCapitalize={
          props.keyboardType === 'email-address' || props.keyboardType === 'url'
            ? 'none'
            : props.autoCapitalize
        }
        placeholderTextColor={colors.placeholder}
        style={[
          styles.input,
          multiline && styles.multiline,
          props.editable === false && styles.inputDisabled,
        ]}
        multiline={multiline}
      />
    </View>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export function PortalLoading() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={styles.loadingText}>Loading business access…</Text>
      </View>
    </SafeAreaView>
  );
}

export function PortalError({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={38} color={colors.orange} />
        <Text style={styles.statusTitle}>Business area unavailable</Text>
        <Text style={styles.statusText}>{message}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryButtonWide}>
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondaryButtonWide}>
          <Text style={styles.secondaryText}>Back to customer app</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
