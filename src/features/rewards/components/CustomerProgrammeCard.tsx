import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { safeErrorMessage } from '../../../lib/errors';
import { rewardStyles as s } from '../styles';
import { LoyaltyAccount, LoyaltyProgram } from '../types';

export function CustomerProgrammeCard({
  program,
  account,
  busy,
  onJoin,
}: {
  program: LoyaltyProgram;
  account?: LoyaltyAccount;
  busy: boolean;
  onJoin: (id: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const tiers = [...(program.tiers ?? [])].sort((a, b) => a.threshold - b.threshold);
  const current = [...tiers].reverse().find((tier) => tier.threshold <= Number(account?.lifetimeEarned ?? 0));
  const next = tiers.find((tier) => tier.threshold > Number(account?.lifetimeEarned ?? 0));
  const progress = next
    ? Math.min(100, Math.round((Number(account?.lifetimeEarned ?? 0) / next.threshold) * 100))
    : 100;
  const join = async () => {
    setError(null);
    try {
      await onJoin(program.id);
    } catch (caught) {
      setError(safeErrorMessage(caught, 'Could not join this programme. Please try again.'));
    }
  };
  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{program.name}</Text>
          <Text style={s.meta}>{program.type} programme</Text>
        </View>
        {account ? (
          <Text style={s.cardTitle}>
            {account.balance} {account.balance === 1 ? program.unitSingular : program.unitPlural}
          </Text>
        ) : null}
      </View>
      <Text style={s.meta}>{program.description}</Text>
      {account ? (
        <>
          <Text style={s.meta}>
            {current ? `${current.name} tier · ` : ''}
            {next
              ? `${Math.max(0, next.threshold - account.lifetimeEarned)} until ${next.name}`
              : 'Highest configured tier unlocked'}
          </Text>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: progress }}
            style={s.progress}
          >
            <View style={[s.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={s.meta}>Lifetime progress: {account.lifetimeEarned}</Text>
        </>
      ) : program.status === 'active' ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void join()}
          style={[s.secondary, busy && s.disabled]}
        >
          <Text style={s.secondaryText}>Join rewards</Text>
        </Pressable>
      ) : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={s.warningText}>
          {error}
        </Text>
      ) : null}
      <Text style={s.meta}>{program.terms}</Text>
      {program.endsAt ? (
        <Text style={s.meta}>Available until {new Date(program.endsAt).toLocaleString()}</Text>
      ) : null}
    </View>
  );
}
