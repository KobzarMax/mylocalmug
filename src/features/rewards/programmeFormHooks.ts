import { useMemo, useState } from 'react';

import { LoyaltyProgram, LoyaltyProgramInput, MenuChoice } from './types';

export const programmeSteps = ['Programme basics', 'Earning eligibility', 'Schedule, tiers & review'];

export function useProgrammeDraft(program: LoyaltyProgram | null, menu: MenuChoice[]) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'stamp' | 'points'>(program?.type ?? 'stamp');
  const [method, setMethod] = useState<'item' | 'spend'>(program?.earningMethod ?? 'item');
  const [name, setName] = useState(program?.name ?? '');
  const [description, setDescription] = useState(program?.description ?? '');
  const [singular, setSingular] = useState(program?.unitSingular ?? 'stamp');
  const [plural, setPlural] = useState(program?.unitPlural ?? 'stamps');
  const [rate, setRate] = useState(String(program?.pointsPerPound ?? 1));
  const [startsAt, setStartsAt] = useState(program?.startsAt ?? '');
  const [endsAt, setEndsAt] = useState(program?.endsAt ?? '');
  const [terms, setTerms] = useState(
    program?.terms ??
      'Earn progress only on staff-verified purchases. Rewards have no cash value and are non-transferable.',
  );
  const [selected, setSelected] = useState(
    (program?.eligibility ?? []).flatMap((entry) => (entry.menuItemId ? [entry.menuItemId] : [])),
  );
  const [selectedCategories, setSelectedCategories] = useState(
    (program?.eligibility ?? []).flatMap((entry) => (entry.categoryId ? [entry.categoryId] : [])),
  );
  const [units, setUnits] = useState<Record<string, string>>(
    Object.fromEntries(
      (program?.eligibility ?? []).map((entry) => [
        entry.menuItemId ?? entry.categoryId ?? '',
        String(entry.unitsPerItem),
      ]),
    ),
  );
  const [tiers, setTiers] = useState(
    (program?.tiers ?? []).map((tier) => `${tier.name}: ${tier.threshold}`).join('\n'),
  );
  const grouped = useMemo(
    () =>
      Object.entries(
        menu.reduce<Record<string, MenuChoice[]>>((all, item) => {
          (all[item.categoryName] ??= []).push(item);
          return all;
        }, {}),
      ),
    [menu],
  );
  const selectType = (value: 'stamp' | 'points') => {
    setType(value);
    if (value === 'stamp') setMethod('item');
    setSingular(value === 'stamp' ? 'stamp' : 'point');
    setPlural(value === 'stamp' ? 'stamps' : 'points');
  };
  const advance = () => {
    setError(null);
    if (step === 0 && (!name.trim() || !singular.trim() || !plural.trim()))
      return setError('Add a programme name and labels for the earning unit.');
    if (step === 1 && method === 'item' && selected.length + selectedCategories.length === 0)
      return setError('Choose at least one eligible menu item or category.');
    setStep((current) => Math.min(programmeSteps.length - 1, current + 1));
  };
  const input = (): LoyaltyProgramInput => ({
    type,
    name,
    description,
    unitSingular: singular,
    unitPlural: plural,
    earningMethod: type === 'stamp' ? 'item' : method,
    pointsPerPound: method === 'spend' ? Number(rate) : null,
    terms,
    effectiveAt: new Date().toISOString(),
    startsAt: startsAt.trim() || null,
    endsAt: endsAt.trim() || null,
    eligibility: [
      ...selected.map((menuItemId) => ({ menuItemId, unitsPerItem: Number(units[menuItemId] ?? 1) })),
      ...selectedCategories.map((categoryId) => ({
        categoryId,
        unitsPerItem: Number(units[categoryId] ?? 1),
      })),
    ],
    tiers: tiers
      .split('\n')
      .filter(Boolean)
      .map((line, index) => {
        const [label, value] = line.split(':');
        return { name: label.trim(), threshold: Number(value?.trim()), sortOrder: index };
      }),
  });
  return {
    step,
    setStep,
    error,
    setError,
    type,
    method,
    name,
    description,
    singular,
    plural,
    rate,
    startsAt,
    endsAt,
    terms,
    selected,
    selectedCategories,
    units,
    tiers,
    grouped,
    setMethod,
    setName,
    setDescription,
    setSingular,
    setPlural,
    setRate,
    setStartsAt,
    setEndsAt,
    setTerms,
    setSelected,
    setSelectedCategories,
    setUnits,
    setTiers,
    selectType,
    advance,
    input,
  };
}
