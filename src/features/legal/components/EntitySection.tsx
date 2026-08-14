import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BusinessLegalProfileInput, ENTITY_OPTIONS, UkLegalEntityType } from '../types';
import { styles } from '../styles';
import { LegalFormField } from './LegalFormField';

export function EntitySection({ form, disabled, update }: {
  form: BusinessLegalProfileInput;
  disabled: boolean;
  update: <Key extends keyof BusinessLegalProfileInput>(key: Key, value: BusinessLegalProfileInput[Key]) => void;
}) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>Legal entity</Text><Text style={styles.sectionHint}>Select how the organisation is legally constituted in the UK.</Text>
    <View style={styles.entityGrid}>{ENTITY_OPTIONS.map((option) => {
      const active = form.entityType === option.value;
      return <Pressable key={option.value} disabled={disabled} onPress={() => update('entityType', option.value as UkLegalEntityType)} style={[styles.entityOption, active && styles.entityActive, disabled && styles.actionDisabled]}><Text style={[styles.entityText, active && styles.entityTextActive]}>{option.label}</Text></Pressable>;
    })}</View>
    <LegalFormField label="Registered legal name" value={form.legalName} onChangeText={(value) => update('legalName', value)} disabled={disabled} />
    <LegalFormField label="Trading name" value={form.tradingName} onChangeText={(value) => update('tradingName', value)} disabled={disabled} />
  </View>;
}
