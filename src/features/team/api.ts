import { supabase } from '../../lib/supabase';
import { MemberRole } from '../business/types';

import { CreatedInvitation, MembershipStatus, TeamInvitation, TeamMember } from './types';

export async function getTeam(
  businessId: string,
): Promise<{ members: TeamMember[]; invitations: TeamInvitation[] }> {
  const [membershipsResult, invitationsResult] = await Promise.all([
    supabase
      .from('business_memberships')
      .select('profile_id, role, status, joined_at')
      .eq('business_id', businessId)
      .neq('status', 'removed')
      .order('joined_at'),
    supabase
      .from('business_invitations')
      .select('id, business_id, email, role, status, expires_at, created_at')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ]);
  if (membershipsResult.error) throw membershipsResult.error;
  if (invitationsResult.error) throw invitationsResult.error;

  const profileIds = (membershipsResult.data ?? []).map((row) => row.profile_id as string);
  const profilesResult = profileIds.length
    ? await supabase.from('profiles').select('id, display_name, avatar_path').in('id', profileIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

  return {
    members: (membershipsResult.data ?? []).map((row) => {
      const profile = profiles.get(row.profile_id);
      return {
        profileId: row.profile_id,
        displayName: profile?.display_name ?? 'Team member',
        avatarPath: profile?.avatar_path ?? null,
        role: row.role as MemberRole,
        status: row.status as MembershipStatus,
        joinedAt: row.joined_at,
      };
    }),
    invitations: (invitationsResult.data ?? []).map(mapInvitation),
  };
}

export async function getPendingInvitations(email: string): Promise<TeamInvitation[]> {
  const result = await supabase
    .from('business_invitations')
    .select('id, business_id, email, role, status, expires_at, created_at')
    .eq('email', email.trim().toLowerCase())
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (result.error) throw result.error;
  return (result.data ?? []).map(mapInvitation);
}

export async function createInvitation(
  businessId: string,
  email: string,
  role: Exclude<MemberRole, 'owner'>,
): Promise<CreatedInvitation> {
  const result = await supabase.rpc('create_business_invitation', {
    target_business_id: businessId,
    invite_email: email,
    invite_role: role,
  });
  if (result.error) throw result.error;
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row) throw new Error('Invitation was created without a share code.');
  return {
    id: row.invitation_id,
    token: row.invitation_token,
    email,
    role,
    expiresAt: row.invitation_expires_at,
  };
}

export async function acceptInvitation(token: string) {
  const result = await supabase.rpc('accept_business_invitation', { invitation_token: token });
  if (result.error) throw result.error;
  return result.data as string;
}

export async function revokeInvitation(invitationId: string) {
  const result = await supabase.rpc('revoke_business_invitation', { target_invitation_id: invitationId });
  if (result.error) throw result.error;
}

export async function changeMemberRole(businessId: string, profileId: string, role: MemberRole) {
  const result = await supabase.rpc('change_business_member_role', {
    target_business_id: businessId,
    target_profile_id: profileId,
    next_role: role,
  });
  if (result.error) throw result.error;
}

export async function changeMemberStatus(businessId: string, profileId: string, status: MembershipStatus) {
  const result = await supabase.rpc('set_business_member_status', {
    target_business_id: businessId,
    target_profile_id: profileId,
    next_status: status,
  });
  if (result.error) throw result.error;
}

type RawInvitation = {
  id: string;
  business_id: string;
  email: string;
  role: MemberRole;
  status: TeamInvitation['status'];
  expires_at: string;
  created_at: string;
};

function mapInvitation(row: RawInvitation): TeamInvitation {
  return {
    id: row.id,
    businessId: row.business_id,
    email: row.email,
    role: row.role,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
