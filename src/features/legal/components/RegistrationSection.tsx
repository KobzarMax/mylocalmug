import React from 'react';
import { Switch, Text, View } from 'react-native';
import { palette } from '../../../lib/design';
import { BusinessLegalProfileInput } from '../types';
import { styles } from '../styles';
import { LegalFormField } from './LegalFormField';

export function RegistrationSection({ form, disabled, update }: {
  form: BusinessLegalProfileInput;
  disabled: boolean;
  update: <Key extends keyof BusinessLegalProfileInput>(key: Key, value: BusinessLegalProfileInput[Key]) => void;
}) {
  const needsCompany = ['limited_company', 'limited_liability_partnership'].includes(form.entityType);
  return <View style={styles.section}><Text style={styles.sectionTitle}>Registration</Text><Text style={styles.sectionHint}>Format checks do not verify these details with Companies House or HMRC.</Text>
    {needsCompany && <LegalFormField label="Companies House number" value={form.companyNumber} onChangeText={(value) => update('companyNumber', value)} disabled={disabled} autoCapitalize="characters" />}
    {form.entityType === 'charity' && <LegalFormField label="Charity number" value={form.charityNumber} onChangeText={(value) => update('charityNumber', value)} disabled={disabled} keyboardType="numbers-and-punctuation" />}
    <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchTitle}>VAT registered</Text><Text style={styles.switchHint}>Enable this only if the organisation has a UK VAT registration.</Text></View><Switch value={form.vatRegistered} onValueChange={(value) => update('vatRegistered', value)} disabled={disabled} trackColor={{ false: palette.line, true: palette.mint }} thumbColor={form.vatRegistered ? palette.green : palette.muted} /></View>
    {form.vatRegistered && <LegalFormField label="UK VAT number" value={form.vatNumber} onChangeText={(value) => update('vatNumber', value)} disabled={disabled} autoCapitalize="characters" keyboardType="numbers-and-punctuation" placeholder="GB123456789" />}
  </View>;
}
