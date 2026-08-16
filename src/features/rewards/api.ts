import { supabase } from '../../lib/supabase';

import { mapAccount, mapLedger, mapOffer, mapProgram } from './mappers';
import {
  ClaimedChallenge,
  EarningReceipt,
  EventChoice,
  EventMenuLink,
  LoyaltyOfferInput,
  LoyaltyProgramInput,
  LoyaltyProgramStatus,
  LoyaltyQrChallenge,
  LoyaltyStats,
  MenuChoice,
  VerifiedPurchaseInput,
} from './types';
import { validateOffer, validateProgram, validatePurchase } from './validation';

const key = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

export async function getBusinessRewards(businessId: string) {
  const [programs, offers, memberships, issuances, redemptions, reversals] = await Promise.all([
    supabase
      .from('loyalty_programs')
      .select(
        '*, businesses(name), loyalty_program_versions(*, loyalty_tiers(*), loyalty_program_eligibility(*))',
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false }),
    supabase
      .from('loyalty_offers')
      .select('*, loyalty_offer_items(*), loyalty_meal_deal_groups(*, loyalty_meal_deal_group_items(*))')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false }),
    supabase
      .from('loyalty_accounts')
      .select('id, loyalty_programs!inner(business_id)', { count: 'exact', head: true })
      .eq('loyalty_programs.business_id', businessId),
    supabase
      .from('loyalty_purchase_events')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId),
    supabase
      .from('loyalty_redemptions')
      .select('id, loyalty_offers!inner(business_id)', { count: 'exact', head: true })
      .eq('loyalty_offers.business_id', businessId),
    supabase
      .from('loyalty_purchase_events')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .not('reversed_at', 'is', null),
  ]);
  for (const result of [programs, offers, memberships, issuances, redemptions, reversals])
    if (result.error) throw result.error;
  const stats: LoyaltyStats = {
    memberships: memberships.count ?? 0,
    issuances: issuances.count ?? 0,
    redemptions: redemptions.count ?? 0,
    reversals: reversals.count ?? 0,
  };
  return {
    programs: (programs.data ?? []).map(mapProgram),
    offers: (offers.data ?? []).map(mapOffer),
    stats,
  };
}

export async function getCustomerRewards(customerId: string) {
  const [programs, accounts, offers, ledger, unlocks] = await Promise.all([
    supabase
      .from('loyalty_programs')
      .select(
        '*, businesses(name), loyalty_program_versions(*, loyalty_tiers(*), loyalty_program_eligibility(*))',
      )
      .in('status', ['active', 'scheduled', 'paused', 'ended'])
      .order('created_at', { ascending: false }),
    supabase.from('loyalty_accounts').select('*').eq('customer_id', customerId),
    supabase
      .from('loyalty_offers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('loyalty_ledger').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('loyalty_tier_unlocks').select('tier_id'),
  ]);
  for (const result of [programs, accounts, offers, ledger, unlocks]) if (result.error) throw result.error;
  return {
    programs: (programs.data ?? []).map(mapProgram),
    accounts: (accounts.data ?? []).map(mapAccount),
    offers: (offers.data ?? []).map(mapOffer),
    ledger: (ledger.data ?? []).map(mapLedger),
    unlockedTierIds: (unlocks.data ?? []).map((row) => row.tier_id),
  };
}

export async function getRewardMenu(businessId: string): Promise<MenuChoice[]> {
  const result = await supabase
    .from('menu_items')
    .select('id,name,category_id,menu_categories(name)')
    .eq('business_id', businessId)
    .eq('is_available', true)
    .order('name');
  if (result.error) throw result.error;
  return (result.data ?? []).map((raw) => {
    const category = raw.menu_categories;
    return {
      id: raw.id,
      name: raw.name,
      categoryId: raw.category_id,
      categoryName: category?.name ?? 'Other',
    };
  });
}

export async function getBusinessEvents(businessId: string): Promise<EventChoice[]> {
  const result = await supabase
    .from('posts')
    .select('id,title,event_starts_at,event_ends_at')
    .eq('business_id', businessId)
    .eq('kind', 'event')
    .is('archived_at', null)
    .order('event_starts_at', { ascending: false });
  if (result.error) throw result.error;
  return (result.data ?? [])
    .filter((row) => row.event_starts_at)
    .map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: row.event_starts_at!,
      endsAt: row.event_ends_at,
    }));
}

export async function saveProgram(businessId: string, programId: string | null, input: LoyaltyProgramInput) {
  const parsed = validateProgram(input);
  const result = await supabase.rpc('save_loyalty_program', {
    target_business_id: businessId,
    target_program_id: programId,
    input: parsed,
  });
  if (result.error) throw result.error;
  return mapProgram(result.data);
}
export async function setProgramStatus(programId: string, status: LoyaltyProgramStatus) {
  const result = await supabase.rpc('set_loyalty_program_status', {
    target_program_id: programId,
    next_status: status,
  });
  if (result.error) throw result.error;
  return mapProgram(result.data);
}
export async function saveOffer(businessId: string, offerId: string | null, input: LoyaltyOfferInput) {
  const parsed = validateOffer(input);
  const result = await supabase.rpc('save_loyalty_offer', {
    target_business_id: businessId,
    target_offer_id: offerId,
    input: parsed,
  });
  if (result.error) throw result.error;
  return mapOffer(result.data);
}
export async function joinProgram(programId: string) {
  const result = await supabase.rpc('join_loyalty_program', { target_program_id: programId });
  if (result.error) throw result.error;
  return mapAccount(result.data);
}

export async function createChallenge(
  businessId: string,
  purpose: 'earn' | 'redeem',
  offerId: string | null,
): Promise<LoyaltyQrChallenge> {
  const result = await supabase.rpc('create_loyalty_challenge', {
    target_business_id: businessId,
    requested_purpose: purpose,
    target_offer_id: offerId ?? undefined,
  });
  if (result.error) throw result.error;
  const row = result.data[0];
  return {
    challengeId: String(row.challenge_id),
    challengeToken: String(row.challenge_token),
    expiresAt: String(row.expires_at),
  };
}
export async function claimChallenge(token: string): Promise<ClaimedChallenge> {
  const result = await supabase.rpc('claim_loyalty_challenge', { challenge_token: token.trim() });
  if (result.error) throw result.error;
  const row = result.data[0];
  if (row.error_message) throw new Error(String(row.error_message));
  return {
    challengeId: String(row.challenge_id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    customerName: String(row.customer_name),
    purpose: row.purpose as 'earn' | 'redeem',
    offerId: row.offer_id ? String(row.offer_id) : null,
    expiresAt: String(row.expires_at),
  };
}
export async function confirmEarning(
  challengeId: string,
  input: VerifiedPurchaseInput,
  requestKey = key(),
): Promise<EarningReceipt> {
  const parsed = validatePurchase(input);
  const result = await supabase.rpc('confirm_loyalty_earning', {
    target_challenge_id: challengeId,
    requested_items: parsed.items,
    final_eligible_pence: parsed.finalEligiblePence,
    request_key: requestKey,
  });
  if (result.error) throw result.error;
  return result.data as EarningReceipt;
}
export async function consumeRedemption(
  challengeId: string,
  items: VerifiedPurchaseInput['items'],
  requestKey = key(),
) {
  const result = await supabase.rpc('consume_loyalty_redemption', {
    target_challenge_id: challengeId,
    requested_items: items,
    request_key: requestKey,
  });
  if (result.error) throw result.error;
  return result.data;
}
export async function reversePurchase(purchaseId: string, reason: string) {
  const result = await supabase.rpc('reverse_loyalty_purchase', {
    target_purchase_id: purchaseId,
    reason: reason.trim(),
    request_key: key(),
  });
  if (result.error) throw result.error;
  return result.data;
}
export async function saveEventMenuLink(input: EventMenuLink) {
  const result = await supabase.rpc('save_event_menu_link', {
    target_event_id: input.eventId,
    target_menu_item_id: input.menuItemId,
    badge_text: input.badge,
    message_text: input.message,
    available_from: input.availableFrom,
    available_until: input.availableUntil,
    is_event_only: input.eventOnly,
  });
  if (result.error) throw result.error;
  return result.data;
}
