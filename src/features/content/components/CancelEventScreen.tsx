import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { palette } from '../../../lib/design';
import { styles } from '../styles';
import { ContentItem } from '../types';
import { ContentHeader } from './ContentUI';

export function CancelEventScreen({ item, busy, onBack, onCancel }: { item: ContentItem; busy: boolean; onBack: () => void; onCancel: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const submit = () => onCancel(reason).catch((caught) => Alert.alert('Could not cancel event', caught instanceof Error ? caught.message : 'Please try again.'));
  return <SafeAreaView style={styles.safe}><View style={styles.scroll}>
    <ContentHeader title="Cancel event" onBack={onBack} />
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.intro}>Followers will receive one cancellation alert and future reminders will stop. The cancelled event remains visible.</Text>
    <View style={styles.field}><Text style={styles.label}>Reason for cancellation</Text><TextInput value={reason} onChangeText={setReason} editable={!busy} maxLength={300} multiline placeholder="Explain what changed" placeholderTextColor="#9B918A" style={[styles.input, styles.multiline]} /></View>
    <Pressable disabled={busy || reason.trim().length < 3} onPress={submit} style={[styles.primaryButton, { backgroundColor: palette.orange, marginTop: 20 }, (busy || reason.trim().length < 3) && styles.disabled]}>{busy ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.primaryText}>Cancel event and notify followers</Text>}</Pressable>
  </View></SafeAreaView>;
}

