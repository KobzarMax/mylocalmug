import { useCallback, useEffect, useState } from 'react';
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
import { invitationInputSchema, invitationTokenSchema } from './validation';
import { CreatedInvitation, MembershipStatus, TeamInvitation, TeamMember } from './types';

export function useTeam(businessId: string) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const team = await getTeam(businessId);
      setMembers(team.members);
      setInvitations(team.invitations);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the team.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);
  useEffect(() => { refresh(); }, [refresh]);

  const runAndRefresh = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); await refresh(); } finally { setBusy(false); }
  };
  const revoke = (invitationId: string) => runAndRefresh(() => revokeInvitation(invitationId));
  const setRole = (profileId: string, role: MemberRole) => runAndRefresh(() => changeMemberRole(businessId, profileId, role));
  const setStatus = (profileId: string, status: MembershipStatus) => runAndRefresh(() => changeMemberStatus(businessId, profileId, status));

  return { members, invitations, loading, busy, error, refresh, revoke, setRole, setStatus };
}

export function useInviteMember(businessId: string) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<MemberRole, 'owner'>>('barista');
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = invitationInputSchema.safeParse({ email, role });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invitation details are invalid.');
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
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setInvitations(await getPendingInvitations(email)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not check invitations.'); }
    finally { setLoading(false); }
  }, [email]);
  useEffect(() => { refresh(); }, [refresh]);

  const accept = async (token: string) => {
    const parsed = invitationTokenSchema.safeParse(token);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invitation code is invalid.');
    setBusy(true);
    try { return await acceptInvitation(parsed.data); }
    finally { setBusy(false); }
  };
  return { invitations, loading, busy, error, refresh, accept };
}
