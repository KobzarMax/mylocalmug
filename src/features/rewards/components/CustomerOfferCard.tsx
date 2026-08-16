import { Pressable, Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';
import { LoyaltyAccount, LoyaltyOffer } from '../types';

export function CustomerOfferCard({
  offer,
  account,
  tierUnlocked,
  onRedeem,
}: {
  offer: LoyaltyOffer;
  account?: LoyaltyAccount;
  tierUnlocked: boolean;
  onRedeem: () => void;
}) {
  const tierLocked = (offer.audience === 'tier' || offer.kind === 'tier_perk') && !tierUnlocked;
  const locked =
    (offer.audience === 'members' && !account) ||
    tierLocked ||
    (offer.kind === 'balance_reward' && (!account || account.balance < (offer.balanceCost ?? 0)));
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{offer.title}</Text>
      <Text style={s.meta}>{offer.description}</Text>
      <Text style={s.meta}>
        {benefit(offer)}
        {offer.balanceCost ? ` · ${offer.balanceCost} required` : ''}
      </Text>
      {offer.usageLimit && offer.usagePeriod ? (
        <Text style={s.meta}>
          {offer.usageLimit} use{offer.usageLimit === 1 ? '' : 's'} per {offer.usagePeriod}
        </Text>
      ) : null}
      {offer.endsAt ? <Text style={s.meta}>Ends {new Date(offer.endsAt).toLocaleString()}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityHint={
          locked
            ? 'Join or earn the required loyalty progress first'
            : 'Creates a short-lived single-use code'
        }
        disabled={locked}
        onPress={onRedeem}
        style={[s.secondary, locked && s.disabled]}
      >
        <Text style={s.secondaryText}>{locked ? 'Not yet eligible' : 'Create one-time redemption code'}</Text>
      </Pressable>
    </View>
  );
}

function benefit(offer: LoyaltyOffer) {
  if (offer.benefitType === 'percentage_discount') return `${offer.percentageOff}% discount`;
  if (offer.benefitType === 'fixed_discount')
    return `£${((offer.amountPence ?? 0) / 100).toFixed(2)} discount`;
  if (offer.benefitType === 'bundle_price')
    return `Bundle price £${((offer.amountPence ?? 0) / 100).toFixed(2)}`;
  return offer.benefitType.replaceAll('_', ' ');
}
