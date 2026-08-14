import React from 'react';
import { Text, View } from 'react-native';
import { BusinessLegalProfile } from '../types';
import { styles } from '../styles';

const statusCopy = {
  draft: { title: 'Draft legal profile', text: 'Complete the information and submit it for owner or admin approval.' },
  pending_approval: { title: 'Awaiting approval', text: 'The submitted information is locked while an owner or admin reviews it.' },
  approved: { title: 'Owner-approved', text: 'This information is ready for future payment-provider onboarding. It is not government-verified.' },
};

export function LegalStatusCard({ profile }: { profile: BusinessLegalProfile }) {
  const copy = statusCopy[profile.status];
  return <><View style={styles.statusCard}><Text style={styles.statusTitle}>{copy.title}</Text><Text style={styles.statusText}>{copy.text}</Text></View>
    {profile.changeRequestNote ? <View style={styles.warningCard}><Text style={styles.warningTitle}>Changes requested</Text><Text style={styles.warningText}>{profile.changeRequestNote}</Text></View> : null}
  </>;
}
