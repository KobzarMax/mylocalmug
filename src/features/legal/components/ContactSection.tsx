import React from 'react';
import { Text, View } from 'react-native';
import { BusinessLegalProfileInput } from '../types';
import { styles } from '../styles';
import { LegalFormField } from './LegalFormField';

export function ContactSection({ form, disabled, update }: {
  form: BusinessLegalProfileInput;
  disabled: boolean;
  update: <Key extends keyof BusinessLegalProfileInput>(key: Key, value: BusinessLegalProfileInput[Key]) => void;
}) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>Legal contact</Text><Text style={styles.sectionHint}>Private contact details for onboarding and payment-account notices.</Text>
    <LegalFormField label="Contact email" value={form.contactEmail} onChangeText={(value) => update('contactEmail', value)} disabled={disabled} keyboardType="email-address" autoCapitalize="none" />
    <LegalFormField label="Contact phone" value={form.contactPhone} onChangeText={(value) => update('contactPhone', value)} disabled={disabled} keyboardType="phone-pad" />
  </View>;
}
