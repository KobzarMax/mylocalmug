export type LoyaltyProgramType = 'stamp' | 'points';
export type LoyaltyProgramStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
export type LoyaltyEarningMethod = 'item' | 'spend';
export type LoyaltyOfferKind = 'balance_reward' | 'tier_perk' | 'promotion';
export type LoyaltyBenefitType =
  'free_item' | 'custom_perk' | 'fixed_discount' | 'percentage_discount' | 'bundle_price';
export type LoyaltyOfferAudience = 'everyone' | 'members' | 'tier';
export type LoyaltyUsagePeriod = 'day' | 'week' | 'month';

export type LoyaltyTierInput = { name: string; threshold: number; sortOrder: number };
export type LoyaltyEligibilityInput = { menuItemId?: string; categoryId?: string; unitsPerItem: number };
export type LoyaltyProgramInput = {
  type: LoyaltyProgramType;
  name: string;
  description: string;
  unitSingular: string;
  unitPlural: string;
  earningMethod: LoyaltyEarningMethod;
  pointsPerPound: number | null;
  terms: string;
  effectiveAt: string;
  startsAt: string | null;
  endsAt: string | null;
  eligibility: LoyaltyEligibilityInput[];
  tiers: LoyaltyTierInput[];
};

export type LoyaltyProgram = {
  id: string;
  businessId: string;
  businessName: string;
  type: LoyaltyProgramType;
  name: string;
  description: string;
  unitSingular: string;
  unitPlural: string;
  status: LoyaltyProgramStatus;
  currentVersion: number;
  startsAt: string | null;
  endsAt: string | null;
  earningMethod?: LoyaltyEarningMethod;
  pointsPerPound?: number | null;
  terms?: string;
  tiers?: LoyaltyTier[];
  eligibility?: LoyaltyEligibilityInput[];
};

export type LoyaltyTier = { id: string; name: string; threshold: number; sortOrder: number };
export type LoyaltyAccount = {
  id: string;
  programId: string;
  customerId: string;
  balance: number;
  lifetimeEarned: number;
  joinedVersion: number;
  joinedAt: string;
};

export type LoyaltyOfferItemInput = { menuItemId: string; role: 'eligible' | 'rewarded'; quantity: number };
export type LoyaltyMealDealGroupInput = {
  name: string;
  quantity: number;
  sortOrder: number;
  menuItemIds: string[];
};
export type LoyaltyOffer = {
  id: string;
  businessId: string;
  programId: string | null;
  tierId: string | null;
  kind: LoyaltyOfferKind;
  benefitType: LoyaltyBenefitType;
  audience: LoyaltyOfferAudience;
  title: string;
  description: string;
  staffInstructions: string;
  balanceCost: number | null;
  amountPence: number | null;
  percentageOff: number | null;
  usageLimit: number | null;
  usagePeriod: LoyaltyUsagePeriod | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  items?: LoyaltyOfferItemInput[];
  mealDealGroups?: LoyaltyMealDealGroupInput[];
};

export type LoyaltyOfferInput = Omit<LoyaltyOffer, 'id' | 'businessId' | 'items' | 'mealDealGroups'> & {
  items: LoyaltyOfferItemInput[];
  mealDealGroups: LoyaltyMealDealGroupInput[];
};

export type LoyaltyLedgerEntry = {
  id: string;
  accountId: string;
  kind: 'earn' | 'redeem' | 'reversal' | 'migration';
  amount: number;
  note: string | null;
  createdAt: string;
};
export type LoyaltyQrChallenge = { challengeId: string; challengeToken: string; expiresAt: string };
export type ClaimedChallenge = {
  challengeId: string;
  businessId: string;
  customerId: string;
  customerName: string;
  purpose: 'earn' | 'redeem';
  offerId: string | null;
  expiresAt: string;
};
export type VerifiedPurchaseInput = {
  items: { menuItemId: string; quantity: number; wasFree: boolean }[];
  finalEligiblePence: number;
};
export type EarningReceipt = {
  purchaseId: string;
  entries: {
    programId: string;
    programName: string;
    amount: number;
    balance?: number;
    lifetimeEarned?: number;
  }[];
};
export type MenuChoice = { id: string; name: string; categoryId: string | null; categoryName: string };
export type EventChoice = { id: string; title: string; startsAt: string; endsAt: string | null };
export type EventMenuLink = {
  eventId: string;
  menuItemId: string;
  badge: string;
  message: string;
  availableFrom: string;
  availableUntil: string;
  eventOnly: boolean;
};
export type LoyaltyStats = { memberships: number; issuances: number; redemptions: number; reversals: number };
