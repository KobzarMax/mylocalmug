import { Pressable, ScrollView, Text, View } from 'react-native';

import { programmeSteps, useProgrammeDraft } from '../programmeFormHooks';
import { rewardStyles as s } from '../styles';
import { LoyaltyProgram, LoyaltyProgramInput, MenuChoice } from '../types';

import { ProgrammeBasicsStep } from './ProgrammeBasicsStep';
import { ProgrammeEligibilityStep } from './ProgrammeEligibilityStep';
import { ProgrammeReviewStep } from './ProgrammeReviewStep';
import { RewardStepHeader } from './RewardStepHeader';
import { RewardHeader } from './RewardUI';

type Props = {
  program: LoyaltyProgram | null;
  menu: MenuChoice[];
  busy: boolean;
  onBack: () => void;
  onSave: (input: LoyaltyProgramInput) => Promise<unknown>;
};

export function ProgrammeForm({ program, menu, busy, onBack, onSave }: Props) {
  const draft = useProgrammeDraft(program, menu);
  const submit = async () => {
    draft.setError(null);
    try {
      await onSave(draft.input());
      onBack();
    } catch (error) {
      draft.setError(error instanceof Error ? error.message : 'Check the programme details.');
    }
  };
  return (
    <ScrollView contentContainerStyle={s.scroll}>
      <RewardHeader title={program ? 'New programme version' : 'Create programme'} onBack={onBack} />
      <RewardStepHeader current={draft.step} labels={programmeSteps} />
      <View style={draft.step === 0 ? undefined : s.hidden}>
        <ProgrammeBasicsStep
          type={draft.type}
          method={draft.method}
          name={draft.name}
          description={draft.description}
          singular={draft.singular}
          plural={draft.plural}
          rate={draft.rate}
          onType={draft.selectType}
          onMethod={draft.setMethod}
          onName={draft.setName}
          onDescription={draft.setDescription}
          onSingular={draft.setSingular}
          onPlural={draft.setPlural}
          onRate={draft.setRate}
        />
      </View>
      <View style={draft.step === 1 ? undefined : s.hidden}>
        <ProgrammeEligibilityStep
          method={draft.method}
          grouped={draft.grouped}
          menu={menu}
          selected={draft.selected}
          selectedCategories={draft.selectedCategories}
          units={draft.units}
          setSelected={draft.setSelected}
          setSelectedCategories={draft.setSelectedCategories}
          setUnits={draft.setUnits}
        />
      </View>
      <View style={draft.step === 2 ? undefined : s.hidden}>
        <ProgrammeReviewStep
          startsAt={draft.startsAt}
          endsAt={draft.endsAt}
          tiers={draft.tiers}
          terms={draft.terms}
          onStartsAt={draft.setStartsAt}
          onEndsAt={draft.setEndsAt}
          onTiers={draft.setTiers}
          onTerms={draft.setTerms}
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
          onPress={draft.step === programmeSteps.length - 1 ? submit : draft.advance}
          style={[s.primary, { flex: 1 }, busy && s.disabled]}
        >
          <Text style={s.primaryText}>
            {busy ? 'Saving…' : draft.step === programmeSteps.length - 1 ? 'Save draft' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
