import { Pressable, ScrollView, Text, View } from 'react-native';

import { offerSteps, useOfferDraft } from '../offerFormHooks';
import { rewardStyles as s } from '../styles';
import { LoyaltyOffer, LoyaltyOfferInput, LoyaltyProgram, MenuChoice } from '../types';

import { OfferBenefitStep } from './OfferBenefitStep';
import { OfferReviewStep } from './OfferReviewStep';
import { OfferSetupStep } from './OfferSetupStep';
import { RewardStepHeader } from './RewardStepHeader';
import { RewardHeader } from './RewardUI';

type Props = {
  offer: LoyaltyOffer | null;
  programs: LoyaltyProgram[];
  menu: MenuChoice[];
  busy: boolean;
  onBack: () => void;
  onSave: (input: LoyaltyOfferInput) => Promise<unknown>;
};

export function OfferForm({ offer, programs, menu, busy, onBack, onSave }: Props) {
  const draft = useOfferDraft(offer, programs, menu);
  const submit = async () => {
    draft.setError(null);
    try {
      await onSave(draft.input());
      onBack();
    } catch (error) {
      draft.setError(error instanceof Error ? error.message : 'Check the offer details.');
    }
  };
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <RewardHeader title={offer ? 'Edit reward or deal' : 'Create reward or deal'} onBack={onBack} />
      <RewardStepHeader current={draft.step} labels={offerSteps} />
      <View style={draft.step === 0 ? undefined : s.hidden}>
        <OfferSetupStep
          kind={draft.kind}
          benefit={draft.benefit}
          programId={draft.programId}
          tierId={draft.tierId}
          programs={programs}
          audience={draft.audience}
          title={draft.title}
          description={draft.description}
          instructions={draft.instructions}
          onKind={draft.selectKind}
          onBenefit={draft.setBenefit}
          onProgram={draft.selectProgram}
          onTier={draft.setTierId}
          onTitle={draft.setTitle}
          onDescription={draft.setDescription}
          onInstructions={draft.setInstructions}
        />
      </View>
      <View style={draft.step === 1 ? undefined : s.hidden}>
        <OfferBenefitStep
          kind={draft.kind}
          benefit={draft.benefit}
          audience={draft.audience}
          cost={draft.cost}
          amount={draft.amount}
          percentage={draft.percentage}
          usageLimit={draft.usageLimit}
          usagePeriod={draft.usagePeriod}
          groups={draft.groups}
          menu={menu}
          onAudience={draft.setAudience}
          onCost={draft.setCost}
          onAmount={draft.setAmount}
          onPercentage={draft.setPercentage}
          onUsageLimit={draft.setUsageLimit}
          onUsagePeriod={draft.setUsagePeriod}
          onCycleGroup={draft.cycleGroup}
        />
      </View>
      <View style={draft.step === 2 ? undefined : s.hidden}>
        <OfferReviewStep
          startsAt={draft.startsAt}
          endsAt={draft.endsAt}
          isActive={draft.isActive}
          onStartsAt={draft.setStartsAt}
          onEndsAt={draft.setEndsAt}
          onActive={draft.setIsActive}
        />
      </View>
      {draft.error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {draft.error}
        </Text>
      ) : null}
      <View style={s.row}>
        {draft.step > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              draft.setError(null);
              draft.setStep((current) => current - 1);
            }}
            style={[s.secondary, { flex: 1 }]}
          >
            <Text style={s.secondaryText}>Previous</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={draft.step === offerSteps.length - 1 ? submit : draft.advance}
          style={[s.primary, { flex: 1 }, busy && s.disabled]}
        >
          <Text style={s.primaryText}>
            {busy ? 'Saving…' : draft.step === offerSteps.length - 1 ? 'Save offer' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
