import { Pressable, Text } from 'react-native';

import { rewardStyles as s } from '../styles';
import { LoyaltyOffer } from '../types';

export function BusinessOfferCard({
  offer,
  canManage,
  onEdit,
}: {
  offer: LoyaltyOffer;
  canManage: boolean;
  onEdit: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={canManage ? 'button' : undefined}
      accessibilityLabel={canManage ? `Edit ${offer.title}` : undefined}
      disabled={!canManage}
      onPress={onEdit}
      style={s.card}
    >
      <Text style={s.cardTitle}>{offer.title}</Text>
      <Text style={s.meta}>
        {offer.kind.replace('_', ' ')} · {offer.benefitType.replaceAll('_', ' ')} · {offer.audience}
      </Text>
      <Text style={s.meta}>{offer.description}</Text>
      {canManage ? <Text style={s.meta}>Tap to edit</Text> : null}
    </Pressable>
  );
}
