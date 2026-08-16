import { Pressable, ScrollView, Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';
import { LoyaltyAccount, LoyaltyLedgerEntry, LoyaltyOffer, LoyaltyProgram } from '../types';

import { CustomerOfferCard } from './CustomerOfferCard';
import { CustomerProgrammeCard } from './CustomerProgrammeCard';
import { RewardActivityList } from './RewardActivityList';
import { EmptyRewards, RewardError, RewardLoading } from './RewardUI';

export function CustomerRewardsWallet({
  programs,
  accounts,
  offers,
  ledger,
  unlockedTierIds,
  loading,
  error,
  busy,
  onRetry,
  onJoin,
  onEarn,
  onRedeem,
}: {
  programs: LoyaltyProgram[];
  accounts: LoyaltyAccount[];
  offers: LoyaltyOffer[];
  ledger: LoyaltyLedgerEntry[];
  unlockedTierIds: string[];
  loading: boolean;
  error: string | null;
  busy: boolean;
  onRetry: () => void;
  onJoin: (id: string) => Promise<void>;
  onEarn: (businessId: string) => void;
  onRedeem: (offer: LoyaltyOffer) => void;
}) {
  if (loading)
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <RewardLoading />
      </ScrollView>
    );
  if (error)
    return (
      <ScrollView contentContainerStyle={s.scroll}>
        <RewardError message={error} onRetry={onRetry} />
      </ScrollView>
    );
  const joined = new Map(accounts.map((account) => [account.programId, account]));
  const businessIds = [
    ...new Set(programs.filter((program) => joined.has(program.id)).map((program) => program.businessId)),
  ];
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <Text style={s.title}>Rewards</Text>
      <Text style={s.intro}>
        Your balances are live and cannot be changed from this device. Show a one-time code after an eligible
        purchase.
      </Text>
      {businessIds.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Earn progress</Text>
          {businessIds.map((id) => (
            <Pressable accessibilityRole="button" key={id} onPress={() => onEarn(id)} style={s.primary}>
              <Text style={s.primaryText}>
                Show code for{' '}
                {programs.find((program) => program.businessId === id)?.businessName || 'coffee shop'}
              </Text>
            </Pressable>
          ))}
        </>
      )}
      <Text style={s.sectionTitle}>Joined programmes</Text>
      {programs
        .filter((program) => joined.has(program.id))
        .map((program) => (
          <View key={program.id}>
            <Text style={s.meta}>{program.businessName}</Text>
            <CustomerProgrammeCard
              program={program}
              account={joined.get(program.id)}
              busy={busy}
              onJoin={onJoin}
            />
          </View>
        ))}
      {!accounts.length ? (
        <EmptyRewards
          title="No joined programmes"
          message="Choose an available programme below to start collecting progress."
        />
      ) : null}
      <Text style={s.sectionTitle}>Available to join</Text>
      {programs
        .filter((program) => !joined.has(program.id))
        .map((program) => (
          <View key={program.id}>
            <Text style={s.meta}>{program.businessName}</Text>
            <CustomerProgrammeCard program={program} busy={busy} onJoin={onJoin} />
          </View>
        ))}
      {!programs.length && (
        <EmptyRewards
          title="No programmes available"
          message="Published shop loyalty programmes will appear here."
        />
      )}
      <Text style={s.sectionTitle}>Available rewards and deals</Text>
      {offers.map((offer) => (
        <CustomerOfferCard
          key={offer.id}
          offer={offer}
          account={offer.programId ? joined.get(offer.programId) : undefined}
          tierUnlocked={Boolean(offer.tierId && unlockedTierIds.includes(offer.tierId))}
          onRedeem={() => onRedeem(offer)}
        />
      ))}
      <RewardActivityList ledger={ledger} />
    </ScrollView>
  );
}
