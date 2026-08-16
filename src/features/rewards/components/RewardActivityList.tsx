import { Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';
import { LoyaltyLedgerEntry } from '../types';

import { EmptyRewards } from './RewardUI';

export function RewardActivityList({ ledger }: { ledger: LoyaltyLedgerEntry[] }) {
  return (
    <>
      <Text style={s.sectionTitle}>Recent activity</Text>
      {ledger.slice(0, 20).map((entry) => (
        <View key={entry.id} style={[s.card, s.row]}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{entry.kind}</Text>
            <Text style={s.meta}>{entry.note || new Date(entry.createdAt).toLocaleString()}</Text>
          </View>
          <Text style={s.cardTitle}>
            {entry.amount > 0 ? '+' : ''}
            {entry.amount}
          </Text>
        </View>
      ))}
      {!ledger.length ? (
        <EmptyRewards
          title="No activity yet"
          message="Verified earning and redemption history will appear here."
        />
      ) : null}
    </>
  );
}
