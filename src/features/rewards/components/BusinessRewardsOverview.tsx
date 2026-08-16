import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { safeErrorMessage } from '../../../lib/errors';
import { rewardStyles as s } from '../styles';
import { LoyaltyOffer, LoyaltyProgram, LoyaltyProgramStatus, LoyaltyStats } from '../types';

import { BusinessOfferCard } from './BusinessOfferCard';
import { BusinessProgrammeCard } from './BusinessProgrammeCard';
import { EmptyRewards, RewardHeader } from './RewardUI';

type Props = {
  programs: LoyaltyProgram[];
  offers: LoyaltyOffer[];
  stats: LoyaltyStats;
  canManage: boolean;
  canIssue: boolean;
  busy: boolean;
  onBack: () => void;
  onCreateProgram: () => void;
  onCreateOffer: () => void;
  onEdit: (program: LoyaltyProgram) => void;
  onEditOffer: (offer: LoyaltyOffer) => void;
  onStatus: (id: string, status: LoyaltyProgramStatus) => Promise<unknown>;
  onScan: () => void;
  onLinkEvent: () => void;
};
export function BusinessRewardsOverview(props: Props) {
  const change = (program: LoyaltyProgram, status: LoyaltyProgramStatus) =>
    Alert.alert(
      `${status[0].toUpperCase() + status.slice(1)} programme?`,
      status === 'archived'
        ? 'Outstanding balances prevent archival.'
        : 'The programme terms and audit history remain available.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            void props
              .onStatus(program.id, status)
              .catch((error) =>
                Alert.alert('Could not update', safeErrorMessage(error, 'Please try again.')),
              ),
        },
      ],
    );
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <RewardHeader title="Rewards" onBack={props.onBack} />
      <Text style={s.intro}>
        Run independent stamp cards, points programmes, tier perks, and staff-validated meal deals.
      </Text>
      <View style={s.wrap}>
        {props.canManage && (
          <Pressable accessibilityRole="button" onPress={props.onCreateProgram} style={s.primary}>
            <Text style={s.primaryText}>New programme</Text>
          </Pressable>
        )}
        {props.canManage && (
          <Pressable accessibilityRole="button" onPress={props.onCreateOffer} style={s.secondary}>
            <Text style={s.secondaryText}>New reward or deal</Text>
          </Pressable>
        )}
        {props.canIssue && (
          <Pressable accessibilityRole="button" onPress={props.onScan} style={s.secondary}>
            <Text style={s.secondaryText}>Scan customer QR</Text>
          </Pressable>
        )}
        {props.canManage && (
          <Pressable accessibilityRole="button" onPress={props.onLinkEvent} style={s.secondary}>
            <Text style={s.secondaryText}>Link event item</Text>
          </Pressable>
        )}
      </View>
      {props.canManage && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Live activity</Text>
          <Text style={s.meta}>
            {props.stats.memberships} memberships · {props.stats.issuances} issuances
          </Text>
          <Text style={s.meta}>
            {props.stats.redemptions} redemptions · {props.stats.reversals} reversals
          </Text>
        </View>
      )}
      <Text style={s.sectionTitle}>Programmes</Text>
      {!props.programs.length ? (
        <EmptyRewards
          title="No loyalty programmes"
          message="Create a stamp card or points programme, review its customer terms, then publish it."
        />
      ) : (
        props.programs.map((program) => (
          <BusinessProgrammeCard
            key={program.id}
            program={program}
            busy={props.busy}
            canManage={props.canManage}
            onEdit={() => props.onEdit(program)}
            onChange={(status) => change(program, status)}
          />
        ))
      )}
      <Text style={s.sectionTitle}>Rewards and promotions</Text>
      {!props.offers.length ? (
        <EmptyRewards
          title="No offers yet"
          message="Add a balance reward, reusable tier perk, or meal deal."
        />
      ) : (
        props.offers.map((offer) => (
          <BusinessOfferCard
            key={offer.id}
            offer={offer}
            canManage={props.canManage}
            onEdit={() => props.onEditOffer(offer)}
          />
        ))
      )}
    </ScrollView>
  );
}
