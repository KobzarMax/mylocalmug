import { Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';
import { LoyaltyOfferInput, LoyaltyProgram } from '../types';

import { RewardChip, RewardField } from './RewardFormControls';

type Props = {
  kind: LoyaltyOfferInput['kind'];
  benefit: LoyaltyOfferInput['benefitType'];
  programId: string | null;
  tierId: string | null;
  programs: LoyaltyProgram[];
  audience: LoyaltyOfferInput['audience'];
  title: string;
  description: string;
  instructions: string;
  onKind: (value: LoyaltyOfferInput['kind']) => void;
  onBenefit: (value: LoyaltyOfferInput['benefitType']) => void;
  onProgram: (id: string) => void;
  onTier: (id: string) => void;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onInstructions: (value: string) => void;
};

export function OfferSetupStep(props: Props) {
  return (
    <>
      <Text style={s.label}>Offer kind</Text>
      <View style={s.wrap}>
        {(['balance_reward', 'tier_perk', 'promotion'] as const).map((value) => (
          <RewardChip
            key={value}
            label={value.replace('_', ' ')}
            active={props.kind === value}
            onPress={() => props.onKind(value)}
          />
        ))}
      </View>
      <Text style={s.sectionTitle}>Benefit</Text>
      <View style={s.wrap}>
        {(['free_item', 'custom_perk', 'fixed_discount', 'percentage_discount', 'bundle_price'] as const).map(
          (value) => (
            <RewardChip
              key={value}
              label={value.replaceAll('_', ' ')}
              active={props.benefit === value}
              onPress={() => props.onBenefit(value)}
            />
          ),
        )}
      </View>
      {props.kind !== 'promotion' || props.audience === 'tier' ? (
        <>
          <Text style={s.sectionTitle}>Programme</Text>
          <View style={s.wrap}>
            {props.programs.map((program) => (
              <RewardChip
                key={program.id}
                label={program.name}
                active={props.programId === program.id}
                onPress={() => props.onProgram(program.id)}
              />
            ))}
          </View>
        </>
      ) : null}
      {props.kind === 'tier_perk' || props.audience === 'tier' ? (
        <>
          <Text style={s.sectionTitle}>Required tier</Text>
          <View style={s.wrap}>
            {(props.programs.find((program) => program.id === props.programId)?.tiers ?? []).map((tier) => (
              <RewardChip
                key={tier.id}
                label={tier.name}
                active={props.tierId === tier.id}
                onPress={() => props.onTier(tier.id)}
              />
            ))}
          </View>
        </>
      ) : null}
      <RewardField label="Title" value={props.title} onChangeText={props.onTitle} />
      <RewardField
        label="Customer description"
        value={props.description}
        onChangeText={props.onDescription}
        multiline
      />
      <RewardField
        label="Staff instructions"
        value={props.instructions}
        onChangeText={props.onInstructions}
        multiline
      />
    </>
  );
}
