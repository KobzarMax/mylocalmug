import { z } from 'zod';
import { LoyaltyOfferInput, LoyaltyProgramInput, VerifiedPurchaseInput } from './types';

const dateString = z.string().datetime({ offset: true });
const eligibility = z.object({ menuItemId: z.string().uuid().optional(), categoryId: z.string().uuid().optional(), unitsPerItem: z.number().int().min(1).max(1000) }).refine((value) => Boolean(value.menuItemId) !== Boolean(value.categoryId), 'Choose one eligibility target.');
const tier = z.object({ name: z.string().trim().min(2).max(60), threshold: z.number().int().min(0).max(10_000_000), sortOrder: z.number().int().min(0) });

export const loyaltyProgramSchema = z.object({
  type: z.enum(['stamp', 'points']), name: z.string().trim().min(3).max(100), description: z.string().trim().max(500),
  unitSingular: z.string().trim().min(1).max(30), unitPlural: z.string().trim().min(1).max(30),
  earningMethod: z.enum(['item', 'spend']), pointsPerPound: z.number().int().min(1).max(10_000).nullable(),
  terms: z.string().trim().min(10).max(4000), effectiveAt: dateString, startsAt: dateString.nullable(), endsAt: dateString.nullable(),
  eligibility: z.array(eligibility).max(200), tiers: z.array(tier).max(20),
}).superRefine((value, context) => {
  if (value.type === 'stamp' && value.earningMethod !== 'item') context.addIssue({ code: 'custom', message: 'Stamp programmes earn by item.', path: ['earningMethod'] });
  if (value.earningMethod === 'spend' && value.pointsPerPound === null) context.addIssue({ code: 'custom', message: 'Set points per pound.', path: ['pointsPerPound'] });
  if (value.earningMethod === 'item' && !value.eligibility.length) context.addIssue({ code: 'custom', message: 'Choose at least one eligible item or category.', path: ['eligibility'] });
  if (value.endsAt && value.startsAt && new Date(value.endsAt) <= new Date(value.startsAt)) context.addIssue({ code: 'custom', message: 'End must follow start.', path: ['endsAt'] });
  const thresholds = value.tiers.map((item) => item.threshold);
  if (new Set(thresholds).size !== thresholds.length) context.addIssue({ code: 'custom', message: 'Tier thresholds must be unique.', path: ['tiers'] });
});

export const loyaltyOfferSchema = z.object({
  programId: z.string().uuid().nullable(), tierId: z.string().uuid().nullable(), kind: z.enum(['balance_reward', 'tier_perk', 'promotion']),
  benefitType: z.enum(['free_item', 'custom_perk', 'fixed_discount', 'percentage_discount', 'bundle_price']), audience: z.enum(['everyone', 'members', 'tier']),
  title: z.string().trim().min(3).max(100), description: z.string().trim().max(500), staffInstructions: z.string().trim().min(3).max(500),
  balanceCost: z.number().int().positive().nullable(), amountPence: z.number().int().min(0).nullable(), percentageOff: z.number().int().min(1).max(100).nullable(),
  usageLimit: z.number().int().positive().nullable(), usagePeriod: z.enum(['day', 'week', 'month']).nullable(), startsAt: dateString.nullable(), endsAt: dateString.nullable(), isActive: z.boolean(),
  items: z.array(z.object({ menuItemId: z.string().uuid(), role: z.enum(['eligible', 'rewarded']), quantity: z.number().int().min(1).max(99) })).max(200),
  mealDealGroups: z.array(z.object({ name: z.string().trim().min(1).max(80), quantity: z.number().int().min(1).max(99), sortOrder: z.number().int().min(0), menuItemIds: z.array(z.string().uuid()).min(1) })).max(10),
}).superRefine((value, context) => {
  if (value.kind === 'balance_reward' && !value.balanceCost) context.addIssue({ code: 'custom', message: 'Balance cost is required.', path: ['balanceCost'] });
  if (value.kind === 'tier_perk' && !value.tierId) context.addIssue({ code: 'custom', message: 'Choose the tier that unlocks this perk.', path: ['tierId'] });
  if (value.audience === 'tier' && !value.tierId) context.addIssue({ code: 'custom', message: 'Choose a tier.', path: ['tierId'] });
  if (value.benefitType === 'percentage_discount' && !value.percentageOff) context.addIssue({ code: 'custom', message: 'Percentage is required.', path: ['percentageOff'] });
  if (['fixed_discount', 'bundle_price'].includes(value.benefitType) && value.amountPence === null) context.addIssue({ code: 'custom', message: 'Amount is required.', path: ['amountPence'] });
  if ((value.usageLimit === null) !== (value.usagePeriod === null)) context.addIssue({ code: 'custom', message: 'Set both usage limit and period.', path: ['usageLimit'] });
});

export const verifiedPurchaseSchema = z.object({ items: z.array(z.object({ menuItemId: z.string().uuid(), quantity: z.number().int().min(1).max(99), wasFree: z.boolean() })).max(100), finalEligiblePence: z.number().int().min(0).max(1_000_000) });

export function validateProgram(input: LoyaltyProgramInput) { return loyaltyProgramSchema.parse(input); }
export function validateOffer(input: LoyaltyOfferInput) { return loyaltyOfferSchema.parse(input); }
export function validatePurchase(input: VerifiedPurchaseInput) { return verifiedPurchaseSchema.parse(input); }
export function calculateSpendPoints(finalEligiblePence: number, pointsPerPound: number) { return Math.floor((finalEligiblePence * pointsPerPound) / 100); }
export function calculateItemUnits(items: Array<{ quantity: number; wasFree: boolean; unitsPerItem: number }>) { return items.reduce((total, item) => total + (item.wasFree ? 0 : item.quantity * item.unitsPerItem), 0); }
export function canIssuerUndo(createdAt: string, now: string) { const elapsed = new Date(now).getTime() - new Date(createdAt).getTime(); return elapsed >= 0 && elapsed <= 300_000; }
