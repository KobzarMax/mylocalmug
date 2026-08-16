import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { safeErrorMessage } from '../../lib/errors';

import {
  getBusinessRewards,
  getCustomerRewards,
  getRewardMenu,
  joinProgram,
  saveOffer,
  saveProgram,
  setProgramStatus,
} from './api';
import { LoyaltyOfferInput, LoyaltyProgramInput, LoyaltyProgramStatus } from './types';

export const rewardKeys = {
  all: ['rewards'] as const,
  business: (businessId: string) => [...rewardKeys.all, 'business', businessId] as const,
  customer: (customerId: string) => [...rewardKeys.all, 'customer', customerId] as const,
};

export function useBusinessRewards(businessId: string) {
  const client = useQueryClient();
  const queryKey = rewardKeys.business(businessId);
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const [rewards, menu] = await Promise.all([getBusinessRewards(businessId), getRewardMenu(businessId)]);
      return { ...rewards, menu };
    },
    meta: { persist: false },
  });
  const refresh = () => client.invalidateQueries({ queryKey });
  const programMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: LoyaltyProgramInput }) =>
      saveProgram(businessId, id, input),
    onSuccess: refresh,
  });
  const offerMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: LoyaltyOfferInput }) =>
      saveOffer(businessId, id, input),
    onSuccess: refresh,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LoyaltyProgramStatus }) =>
      setProgramStatus(id, status),
    onSuccess: refresh,
  });
  const busy = programMutation.isPending || offerMutation.isPending || statusMutation.isPending;
  return {
    programs: query.data?.programs ?? [],
    offers: query.data?.offers ?? [],
    menu: query.data?.menu ?? [],
    stats: query.data?.stats ?? { memberships: 0, issuances: 0, redemptions: 0, reversals: 0 },
    loading: query.isLoading,
    busy,
    error: query.error ? message(query.error) : null,
    refresh,
    saveProgram: (id: string | null, input: LoyaltyProgramInput) =>
      programMutation.mutateAsync({ id, input }),
    saveOffer: (id: string | null, input: LoyaltyOfferInput) => offerMutation.mutateAsync({ id, input }),
    setStatus: (id: string, status: LoyaltyProgramStatus) => statusMutation.mutateAsync({ id, status }),
  };
}

export function useCustomerRewards(customerId: string) {
  const client = useQueryClient();
  const queryKey = rewardKeys.customer(customerId);
  const query = useQuery({
    queryKey,
    queryFn: () => getCustomerRewards(customerId),
    enabled: Boolean(customerId),
    meta: { persist: false },
  });
  const joinMutation = useMutation({
    mutationFn: joinProgram,
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  return {
    programs: query.data?.programs ?? [],
    accounts: query.data?.accounts ?? [],
    offers: query.data?.offers ?? [],
    ledger: query.data?.ledger ?? [],
    unlockedTierIds: query.data?.unlockedTierIds ?? [],
    loading: query.isLoading,
    busy: joinMutation.isPending,
    error: query.error ? message(query.error) : null,
    refresh: () => client.invalidateQueries({ queryKey }),
    join: async (programId: string) => {
      await joinMutation.mutateAsync(programId);
    },
  };
}

export function useCountdown(expiresAt: string | null) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const update = () =>
      setSeconds(Math.max(0, Math.ceil((new Date(expiresAt ?? 0).getTime() - Date.now()) / 1_000)));
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return seconds;
}

export function message(caught: unknown) {
  return safeErrorMessage(caught, 'Please try again.');
}
