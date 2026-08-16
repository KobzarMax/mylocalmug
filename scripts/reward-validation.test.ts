import assert from 'node:assert/strict';

import {
  calculateItemUnits,
  calculateSpendPoints,
  canIssuerUndo,
  validateOffer,
  validateProgram,
  validatePurchase,
} from '../src/features/rewards/validation';

const baseProgram = {
  type: 'points' as const,
  name: 'Coffee points',
  description: 'Earn on coffee.',
  unitSingular: 'point',
  unitPlural: 'points',
  earningMethod: 'spend' as const,
  pointsPerPound: 3,
  terms: 'Earn three points for every full pound of verified eligible spend.',
  effectiveAt: '2026-08-16T10:00:00.000Z',
  startsAt: null,
  endsAt: null,
  eligibility: [],
  tiers: [
    { name: 'Regular', threshold: 0, sortOrder: 0 },
    { name: 'Gold', threshold: 100, sortOrder: 1 },
  ],
};
assert.equal(validateProgram(baseProgram).name, 'Coffee points');
assert.equal(calculateSpendPoints(99, 3), 2);
assert.equal(calculateSpendPoints(350, 2), 7);
assert.equal(
  calculateItemUnits([
    { quantity: 2, wasFree: false, unitsPerItem: 1 },
    { quantity: 5, wasFree: true, unitsPerItem: 10 },
  ]),
  2,
);
assert.throws(() => validateProgram({ ...baseProgram, type: 'stamp', earningMethod: 'spend' }));
assert.throws(() =>
  validateProgram({
    ...baseProgram,
    tiers: [
      { name: 'A', threshold: 10, sortOrder: 0 },
      { name: 'B', threshold: 10, sortOrder: 1 },
    ],
  }),
);
assert.equal(
  validatePurchase({
    items: [{ menuItemId: '46000000-0000-4000-8000-000000000001', quantity: 1, wasFree: false }],
    finalEligiblePence: 350,
  }).finalEligiblePence,
  350,
);
assert.throws(() => validatePurchase({ items: [], finalEligiblePence: -1 }));

const offer = {
  programId: '26000000-0000-4000-8000-000000000001',
  tierId: null,
  kind: 'balance_reward' as const,
  benefitType: 'free_item' as const,
  audience: 'members' as const,
  title: 'Free coffee',
  description: 'One coffee.',
  staffInstructions: 'Validate the customer basket.',
  balanceCost: 10,
  amountPence: null,
  percentageOff: null,
  usageLimit: null,
  usagePeriod: null,
  startsAt: null,
  endsAt: null,
  isActive: true,
  items: [],
  mealDealGroups: [],
};
assert.equal(validateOffer(offer).balanceCost, 10);
assert.throws(() => validateOffer({ ...offer, balanceCost: null }));
assert.throws(() => validateOffer({ ...offer, benefitType: 'percentage_discount', percentageOff: 101 }));
assert.equal(canIssuerUndo('2026-08-16T10:00:00Z', '2026-08-16T10:05:00Z'), true);
assert.equal(canIssuerUndo('2026-08-16T10:00:00Z', '2026-08-16T10:05:01Z'), false);

console.log('reward validation tests passed');
