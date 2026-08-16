import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { safeErrorMessage } from '../../lib/errors';
import { MemberRole } from '../business/types';

import {
  acceptInvitation,
  changeMemberRole,
  changeMemberStatus,
  createInvitation,
  getPendingInvitations,
  getTeam,
  revokeInvitation,
} from './api';
import { CreatedInvitation, MembershipStatus } from './types';
import { invitationInputSchema, invitationTokenSchema } from './validation';

export function useTeam(businessId: string) {
  const queryKey = ['business-team', businessId] as const;
  const client = useQueryClient();
  const query = useQuery({ queryKey, queryFn: () => getTeam(businessId), meta: { persist: false } });
  const mutation = useMutation({
    mutationFn: (action: () => Promise<void>) => action(),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const runAndRefresh = async (action: () => Promise<void>) => {
    await mutation.mutateAsync(action);
  };
  const revoke = (invitationId: string) => runAndRefresh(() => revokeInvitation(invitationId));
  const setRole = (profileId: string, role: MemberRole) =>
    runAndRefresh(() => changeMemberRole(businessId, profileId, role));
  const setStatus = (profileId: string, status: MembershipStatus) =>
    runAndRefresh(() => changeMemberStatus(businessId, profileId, status));

  return {
    members: query.data?.members ?? [],
    invitations: query.data?.invitations ?? [],
    loading: query.isLoading,
    busy: mutation.isPending,
    error: query.error
      ? errorMessage(query.error, 'Could not load the team.')
      : mutation.error
        ? errorMessage(mutation.error, 'Could not update the team.')
        : null,
    refresh: () => client.invalidateQueries({ queryKey }),
    revoke,
    setRole,
    setStatus,
  };
}

export function useInviteMember(businessId: string) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<MemberRole, 'owner'>>('barista');
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = invitationInputSchema.safeParse({ email, role });
    if (!parsed.success)
      throw new Error(parsed.error.issues[0]?.message ?? 'Invitation details are invalid.');
    setBusy(true);
    try {
      const invitation = await createInvitation(businessId, parsed.data.email, parsed.data.role);
      setCreated(invitation);
      return invitation;
    } finally {
      setBusy(false);
    }
  };
  return { email, setEmail, role, setRole, created, setCreated, busy, submit };
}

export function usePendingInvitations(email: string) {
  const queryKey = ['pending-invitations', email] as const;
  const client = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: () => getPendingInvitations(email),
    enabled: Boolean(email),
    meta: { persist: false },
  });
  const acceptance = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  const accept = (token: string) => {
    const parsed = invitationTokenSchema.safeParse(token);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invitation code is invalid.');
    return acceptance.mutateAsync(parsed.data);
  };
  return {
    invitations: query.data ?? [],
    loading: query.isLoading,
    busy: acceptance.isPending,
    error: query.error
      ? errorMessage(query.error, 'Could not check invitations.')
      : acceptance.error
        ? errorMessage(acceptance.error, 'Could not accept this invitation.')
        : null,
    refresh: () => client.invalidateQueries({ queryKey }),
    accept,
  };
}

function errorMessage(error: unknown, fallback: string) {
  return safeErrorMessage(error, fallback);
}
