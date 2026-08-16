import { Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';
import { LoyaltyOfferInput, MenuChoice } from '../types';

import { RewardChip, RewardField } from './RewardFormControls';

type Props = {
  kind: LoyaltyOfferInput['kind'];
  benefit: LoyaltyOfferInput['benefitType'];
  audience: LoyaltyOfferInput['audience'];
  cost: string;
  amount: string;
  percentage: string;
  usageLimit: string;
  usagePeriod: NonNullable<LoyaltyOfferInput['usagePeriod']>;
  groups: Record<string, 0 | 1 | 2>;
  menu: MenuChoice[];
  onAudience: (value: LoyaltyOfferInput['audience']) => void;
  onCost: (value: string) => void;
  onAmount: (value: string) => void;
  onPercentage: (value: string) => void;
  onUsageLimit: (value: string) => void;
  onUsagePeriod: (value: NonNullable<LoyaltyOfferInput['usagePeriod']>) => void;
  onCycleGroup: (id: string) => void;
};

export function OfferBenefitStep(props: Props) {
  return (
    <>
      {props.kind === 'balance_reward' ? (
        <RewardField
          label="Balance cost"
          value={props.cost}
          onChangeText={props.onCost}
          keyboardType="number-pad"
        />
      ) : null}
      {['fixed_discount', 'bundle_price'].includes(props.benefit) ? (
        <RewardField
          label={props.benefit === 'bundle_price' ? 'Bundle price (£)' : 'Discount (£)'}
          value={props.amount}
          onChangeText={props.onAmount}
          keyboardType="decimal-pad"
        />
      ) : null}
      {props.benefit === 'percentage_discount' ? (
        <RewardField
          label="Discount percentage"
          value={props.percentage}
          onChangeText={props.onPercentage}
          keyboardType="number-pad"
        />
      ) : null}
      <Text style={s.sectionTitle}>Audience</Text>
      <View style={s.wrap}>
        {(['everyone', 'members', 'tier'] as const).map((value) => (
          <RewardChip
            key={value}
            label={value}
            active={props.audience === value}
            onPress={() => props.onAudience(value)}
          />
        ))}
      </View>
      {props.kind === 'tier_perk' ? (
        <>
          <RewardField
            label="Uses per period"
            value={props.usageLimit}
            onChangeText={props.onUsageLimit}
            keyboardType="number-pad"
          />
          <Text style={s.sectionTitle}>Usage period</Text>
          <View style={s.wrap}>
            {(['day', 'week', 'month'] as const).map((value) => (
              <RewardChip
                key={value}
                label={value}
                active={props.usagePeriod === value}
                onPress={() => props.onUsagePeriod(value)}
              />
            ))}
          </View>
        </>
      ) : null}
      {props.benefit === 'bundle_price' ? (
        <>
          <Text style={s.sectionTitle}>Meal-deal groups</Text>
          <Text style={s.meta}>Tap each item to cycle: not included → group A → group B.</Text>
          <View style={s.wrap}>
            {props.menu.map((item) => (
              <RewardChip
                key={item.id}
                label={`${props.groups[item.id] === 1 ? 'A · ' : props.groups[item.id] === 2 ? 'B · ' : ''}${item.name}`}
                active={Boolean(props.groups[item.id])}
                onPress={() => props.onCycleGroup(item.id)}
              />
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}
