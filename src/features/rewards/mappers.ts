import { Database } from '../../types/database';

import { LoyaltyAccount, LoyaltyLedgerEntry, LoyaltyOffer, LoyaltyProgram } from './types';

type Tables = Database['public']['Tables'];
type TierRow = Tables['loyalty_tiers']['Row'];
type EligibilityRow = Tables['loyalty_program_eligibility']['Row'];
type VersionRow = Tables['loyalty_program_versions']['Row'] & {
  loyalty_tiers?: TierRow[];
  loyalty_program_eligibility?: EligibilityRow[];
};
export type RewardProgramRow = Tables['loyalty_programs']['Row'] & {
  businesses?: { name: string } | null;
  loyalty_program_versions?: VersionRow[];
};
type OfferItemRow = Tables['loyalty_offer_items']['Row'];
type DealGroupRow = Tables['loyalty_meal_deal_groups']['Row'] & {
  loyalty_meal_deal_group_items?: Tables['loyalty_meal_deal_group_items']['Row'][];
};
export type RewardOfferRow = Tables['loyalty_offers']['Row'] & {
  loyalty_offer_items?: OfferItemRow[];
  loyalty_meal_deal_groups?: DealGroupRow[];
};

export function mapProgram(raw: RewardProgramRow): LoyaltyProgram {
  const versions = raw.loyalty_program_versions ?? [];
  const current = versions.find((item) => Number(item.version) === Number(raw.current_version));
  return {
    id: raw.id,
    businessId: raw.business_id,
    businessName: raw.businesses?.name ?? '',
    type: raw.type,
    name: raw.name,
    description: raw.description,
    unitSingular: raw.unit_singular,
    unitPlural: raw.unit_plural,
    status: raw.status,
    currentVersion: raw.current_version,
    startsAt: raw.starts_at,
    endsAt: raw.ends_at,
    earningMethod: current?.earning_method,
    pointsPerPound: current?.points_per_pound ?? null,
    terms: current?.terms ?? '',
    tiers: (current?.loyalty_tiers ?? []).map((tier) => ({
      id: tier.id,
      name: tier.name,
      threshold: tier.threshold,
      sortOrder: tier.sort_order,
    })),
    eligibility: (current?.loyalty_program_eligibility ?? []).map((entry) => ({
      menuItemId: entry.menu_item_id ?? undefined,
      categoryId: entry.category_id ?? undefined,
      unitsPerItem: entry.units_per_item,
    })),
  };
}

export function mapAccount(row: Tables['loyalty_accounts']['Row']): LoyaltyAccount {
  return {
    id: String(row.id),
    programId: String(row.program_id),
    customerId: String(row.customer_id),
    balance: Number(row.balance),
    lifetimeEarned: Number(row.lifetime_earned),
    joinedVersion: Number(row.joined_version),
    joinedAt: String(row.joined_at),
  };
}

export function mapOffer(row: RewardOfferRow): LoyaltyOffer {
  const groups = row.loyalty_meal_deal_groups ?? [];
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    programId: row.program_id ? String(row.program_id) : null,
    tierId: row.tier_id ? String(row.tier_id) : null,
    kind: row.kind as LoyaltyOffer['kind'],
    benefitType: row.benefit_type as LoyaltyOffer['benefitType'],
    audience: row.audience as LoyaltyOffer['audience'],
    title: String(row.title),
    description: String(row.description ?? ''),
    staffInstructions: String(row.staff_instructions ?? ''),
    balanceCost: row.balance_cost == null ? null : Number(row.balance_cost),
    amountPence: row.amount_pence == null ? null : Number(row.amount_pence),
    percentageOff: row.percentage_off == null ? null : Number(row.percentage_off),
    usageLimit: row.usage_limit == null ? null : Number(row.usage_limit),
    usagePeriod: row.usage_period as LoyaltyOffer['usagePeriod'],
    startsAt: row.starts_at ? String(row.starts_at) : null,
    endsAt: row.ends_at ? String(row.ends_at) : null,
    isActive: Boolean(row.is_active),
    items: (row.loyalty_offer_items ?? []).map((item) => ({
      menuItemId: item.menu_item_id,
      role: item.role === 'rewarded' ? 'rewarded' : 'eligible',
      quantity: item.quantity,
    })),
    mealDealGroups: groups.map((group) => ({
      name: String(group.name),
      quantity: Number(group.quantity),
      sortOrder: Number(group.sort_order),
      menuItemIds: (group.loyalty_meal_deal_group_items ?? []).map((item) => item.menu_item_id),
    })),
  };
}

export function mapLedger(row: Tables['loyalty_ledger']['Row']): LoyaltyLedgerEntry {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    kind: row.kind as LoyaltyLedgerEntry['kind'],
    amount: Number(row.amount),
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at),
  };
}
