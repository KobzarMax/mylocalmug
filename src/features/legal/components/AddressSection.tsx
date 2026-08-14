import React from 'react';
import { Text, View } from 'react-native';
import { BusinessLegalProfileInput } from '../types';
import { styles } from '../styles';
import { LegalFormField } from './LegalFormField';

export function AddressSection({ form, disabled, update }: SectionProps) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>Registered address</Text><Text style={styles.sectionHint}>This may differ from the coffee shop’s public trading location.</Text>
    <LegalFormField label="Address line 1" value={form.registeredAddressLine1} onChangeText={(value) => update('registeredAddressLine1', value)} disabled={disabled} />
    <LegalFormField label="Address line 2 (optional)" value={form.registeredAddressLine2} onChangeText={(value) => update('registeredAddressLine2', value)} disabled={disabled} />
    <LegalFormField label="Town or city" value={form.registeredTownCity} onChangeText={(value) => update('registeredTownCity', value)} disabled={disabled} />
    <LegalFormField label="County (optional)" value={form.registeredCounty} onChangeText={(value) => update('registeredCounty', value)} disabled={disabled} />
    <LegalFormField label="UK postcode" value={form.registeredPostcode} onChangeText={(value) => update('registeredPostcode', value)} disabled={disabled} autoCapitalize="characters" placeholder="SW1A 1AA" />
  </View>;
}

type SectionProps = {
  form: BusinessLegalProfileInput;
  disabled: boolean;
  update: <Key extends keyof BusinessLegalProfileInput>(key: Key, value: BusinessLegalProfileInput[Key]) => void;
};
