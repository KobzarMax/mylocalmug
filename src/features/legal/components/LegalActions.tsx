import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BusinessLegalProfile } from '../types';
import { styles } from '../styles';
import { palette } from '../../../lib/design';

export function LegalActions({ profile, canWrite, canApprove, busy, dirty, onSave, onSubmit, onApprove, onRequestChanges }: {
  profile: BusinessLegalProfile;
  canWrite: boolean;
  canApprove: boolean;
  busy: boolean;
  dirty: boolean;
  onSave: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onRequestChanges: (note: string) => void;
}) {
  const [attested, setAttested] = useState(false);
  const [note, setNote] = useState('');
  if (profile.status === 'pending_approval') {
    if (!canApprove) return <View style={styles.warningCard}><Text style={styles.warningTitle}>Review pending</Text><Text style={styles.warningText}>An owner or administrator must approve this submission or return it for changes.</Text></View>;
    return <View style={styles.section}><Text style={styles.sectionTitle}>Owner or admin review</Text><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: attested }} onPress={() => setAttested((value) => !value)} style={styles.attestation}><View style={[styles.checkbox, attested && styles.checkboxActive]}>{attested && <Ionicons name="checkmark" size={18} color={palette.paper} />}</View><Text style={styles.attestationText}>I confirm that I am authorised to approve this information and that it is accurate to the best of my knowledge.</Text></Pressable>
      <Pressable disabled={!attested || busy} onPress={onApprove} style={[styles.action, (!attested || busy) && styles.actionDisabled]}><Text style={styles.actionText}>Approve legal profile</Text></Pressable>
      <Text style={styles.label}>Reason for changes</Text><TextInput value={note} onChangeText={setNote} editable={!busy} multiline placeholder="Explain what needs to be corrected" style={[styles.input, styles.multilineInput]} />
      <Pressable disabled={note.trim().length < 3 || busy} onPress={() => onRequestChanges(note)} style={[styles.action, styles.danger, (note.trim().length < 3 || busy) && styles.actionDisabled]}><Text style={[styles.actionText, styles.dangerText]}>Return for changes</Text></Pressable>
    </View>;
  }
  if (!canWrite) return null;
  return <View>
    {profile.status === 'approved' && dirty && <View style={styles.warningCard}><Text style={styles.warningTitle}>Approval will be removed</Text><Text style={styles.warningText}>Saving these edits returns the legal profile to draft for a new approval.</Text></View>}
    <Pressable disabled={!dirty || busy} onPress={onSave} style={[styles.action, styles.secondary, (!dirty || busy) && styles.actionDisabled]}><Text style={[styles.actionText, styles.secondaryText]}>Save draft</Text></Pressable>
    {profile.status === 'draft' && <Pressable disabled={busy} onPress={onSubmit} style={[styles.action, busy && styles.actionDisabled]}><Text style={styles.actionText}>Submit for approval</Text></Pressable>}
  </View>;
}
