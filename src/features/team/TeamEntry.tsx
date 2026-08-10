import React, { useState } from 'react';
import { Workspace } from '../business/types';
import { hasPermission } from '../business/permissions';
import { useTeam } from './hooks';
import { CreatedInvitation, MembershipStatus, TeamMember } from './types';
import { InviteMemberForm } from './components/InviteMemberForm';
import { InvitationCreatedScreen } from './components/InvitationCreatedScreen';
import { TeamList } from './components/TeamList';
import { TeamMemberDetail } from './components/TeamMemberDetail';
import { canEditTeamMember, getAssignableTeamRoles } from './permissions';

export function TeamEntry({ workspace, onBack }: { workspace: Workspace; onBack: () => void }) {
  const team = useTeam(workspace.business.id);
  const [inviting, setInviting] = useState(false);
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const canManage = hasPermission(workspace.role, 'team.manage');
  const assignableTeamRoles = getAssignableTeamRoles(workspace.role);

  if (created) return <InvitationCreatedScreen invitation={created} onBack={() => setCreated(null)} onDone={async () => { setCreated(null); setInviting(false); await team.refresh(); }} />;
  if (inviting) return <InviteMemberForm businessId={workspace.business.id} roles={assignableTeamRoles} onBack={() => setInviting(false)} onCreated={setCreated} />;
  if (selected) return <TeamMemberDetail member={selected} editable={canEditTeamMember(workspace.role, selected.role)} roles={assignableTeamRoles} busy={team.busy} onBack={() => setSelected(null)} onRole={async (role) => { await team.setRole(selected.profileId, role); setSelected(null); }} onStatus={async (status: MembershipStatus) => { await team.setStatus(selected.profileId, status); setSelected(null); }} />;
  return <TeamList members={team.members} invitations={team.invitations} loading={team.loading} error={team.error} canManage={canManage} onBack={onBack} onInvite={() => setInviting(true)} onMember={setSelected} onRevoke={team.revoke} onRetry={team.refresh} />;
}
