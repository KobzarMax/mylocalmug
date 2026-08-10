import React, { ReactNode, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { palette } from '../../lib/design';
import { usePendingInvitations } from './hooks';
import { styles } from './styles';
import { AcceptInvitationScreen } from './components/AcceptInvitationScreen';
import { InvitationCheckError } from './components/InvitationCheckError';

export function InvitationAcceptanceGate({ email, onAccepted, children }: { email: string; onAccepted: () => void; children: ReactNode }) {
  const pending = usePendingInvitations(email);
  const [skipped, setSkipped] = useState(false);
  if (pending.loading) return <View style={styles.center}><ActivityIndicator color={palette.green} /></View>;
  if (pending.error && !skipped) return <InvitationCheckError message={pending.error} onRetry={pending.refresh} onContinue={() => setSkipped(true)} />;
  if (pending.invitations.length === 0 || skipped) return <>{children}</>;
  return <AcceptInvitationScreen email={email} invitations={pending.invitations} busy={pending.busy} onSkip={() => setSkipped(true)} onAccept={async (token) => { await pending.accept(token); onAccepted(); }} />;
}
