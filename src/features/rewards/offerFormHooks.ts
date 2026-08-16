import { useState } from 'react';

import { LoyaltyOffer, LoyaltyOfferInput, LoyaltyProgram, MenuChoice } from './types';

export const offerSteps = ['Offer setup', 'Benefit & eligibility', 'Schedule & review'];

export function useOfferDraft(offer: LoyaltyOffer | null, programs: LoyaltyProgram[], menu: MenuChoice[]) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<LoyaltyOfferInput['kind']>(offer?.kind ?? 'balance_reward');
  const [benefit, setBenefit] = useState<LoyaltyOfferInput['benefitType']>(offer?.benefitType ?? 'free_item');
  const [programId, setProgramId] = useState<string | null>(offer?.programId ?? programs[0]?.id ?? null);
  const [tierId, setTierId] = useState<string | null>(offer?.tierId ?? null);
  const [title, setTitle] = useState(offer?.title ?? '');
  const [description, setDescription] = useState(offer?.description ?? '');
  const [instructions, setInstructions] = useState(
    offer?.staffInstructions ?? 'Check the customer basket, then apply this benefit on the till.',
  );
  const [cost, setCost] = useState(String(offer?.balanceCost ?? 10));
  const [amount, setAmount] = useState(offer?.amountPence == null ? '' : String(offer.amountPence / 100));
  const [percentage, setPercentage] = useState(
    offer?.percentageOff == null ? '' : String(offer.percentageOff),
  );
  const [audience, setAudience] = useState<LoyaltyOfferInput['audience']>(offer?.audience ?? 'members');
  const [usageLimit, setUsageLimit] = useState(String(offer?.usageLimit ?? 1));
  const [usagePeriod, setUsagePeriod] = useState<NonNullable<LoyaltyOfferInput['usagePeriod']>>(
    offer?.usagePeriod ?? 'day',
  );
  const [startsAt, setStartsAt] = useState(offer?.startsAt ?? '');
  const [endsAt, setEndsAt] = useState(offer?.endsAt ?? '');
  const [isActive, setIsActive] = useState(offer?.isActive ?? true);
  const [groups, setGroups] = useState<Record<string, 0 | 1 | 2>>(() =>
    Object.fromEntries(
      (offer?.mealDealGroups ?? []).flatMap((group, index) =>
        group.menuItemIds.map((id) => [id, index === 0 ? 1 : 2]),
      ),
    ),
  );
  const selectKind = (value: LoyaltyOfferInput['kind']) => {
    setKind(value);
    setAudience(value === 'promotion' ? 'everyone' : 'members');
  };
  const selectProgram = (id: string) => {
    setProgramId(id);
    setTierId(null);
  };
  const cycleGroup = (id: string) =>
    setGroups((current) => ({ ...current, [id]: (((current[id] ?? 0) + 1) % 3) as 0 | 1 | 2 }));
  const advance = () => {
    setError(null);
    if (step === 0 && (!title.trim() || !description.trim() || !instructions.trim()))
      return setError('Add a title, customer description, and staff instructions.');
    if (
      step === 1 &&
      benefit === 'bundle_price' &&
      (!Object.values(groups).includes(1) || !Object.values(groups).includes(2))
    )
      return setError('Meal deals need at least one item in both group A and group B.');
    setStep((current) => Math.min(offerSteps.length - 1, current + 1));
  };
  const input = (): LoyaltyOfferInput => {
    const group = (number: 1 | 2) => menu.filter((item) => groups[item.id] === number).map((item) => item.id);
    return {
      programId,
      tierId,
      kind,
      benefitType: benefit,
      audience,
      title,
      description,
      staffInstructions: instructions,
      balanceCost: kind === 'balance_reward' ? Number(cost) : null,
      amountPence: ['fixed_discount', 'bundle_price'].includes(benefit)
        ? Math.round(Number(amount) * 100)
        : null,
      percentageOff: benefit === 'percentage_discount' ? Number(percentage) : null,
      usageLimit: kind === 'tier_perk' ? Number(usageLimit) : null,
      usagePeriod: kind === 'tier_perk' ? usagePeriod : null,
      startsAt: startsAt.trim() || null,
      endsAt: endsAt.trim() || null,
      isActive,
      items: [],
      mealDealGroups:
        benefit === 'bundle_price'
          ? [
              { name: 'Choose from group A', quantity: 1, sortOrder: 0, menuItemIds: group(1) },
              { name: 'Choose from group B', quantity: 1, sortOrder: 1, menuItemIds: group(2) },
            ]
          : [],
    };
  };
  return {
    step,
    setStep,
    error,
    setError,
    kind,
    benefit,
    programId,
    tierId,
    title,
    description,
    instructions,
    cost,
    amount,
    percentage,
    audience,
    usageLimit,
    usagePeriod,
    startsAt,
    endsAt,
    isActive,
    groups,
    setBenefit,
    setTierId,
    setTitle,
    setDescription,
    setInstructions,
    setCost,
    setAmount,
    setPercentage,
    setAudience,
    setUsageLimit,
    setUsagePeriod,
    setStartsAt,
    setEndsAt,
    setIsActive,
    selectKind,
    selectProgram,
    cycleGroup,
    advance,
    input,
  };
}
