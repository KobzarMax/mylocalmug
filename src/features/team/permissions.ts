import { hasPermission } from '../business/permissions';
import { MemberRole } from '../business/types';
import { assignableRoles } from './types';

export function getAssignableTeamRoles(actorRole: MemberRole) {
  if (!hasPermission(actorRole, 'team.manage')) return [];
  return assignableRoles.filter((role) => role.value !== 'admin' || actorRole === 'owner');
}

export function canEditTeamMember(actorRole: MemberRole, targetRole: MemberRole) {
  if (!hasPermission(actorRole, 'team.manage') || targetRole === 'owner') return false;
  return targetRole !== 'admin' || actorRole === 'owner';
}
