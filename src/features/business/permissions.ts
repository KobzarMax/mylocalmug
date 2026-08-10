import { MemberRole, Permission } from './types';

const rolePermissions: Record<MemberRole, Permission[]> = {
  owner: ['business.profile.write', 'menu.manage', 'content.manage', 'rewards.manage', 'team.read', 'team.manage', 'payments.read', 'payments.connect', 'analytics.read'],
  admin: ['business.profile.write', 'menu.manage', 'content.manage', 'rewards.manage', 'team.read', 'team.manage', 'payments.read', 'payments.connect', 'analytics.read'],
  manager: ['business.profile.write', 'menu.manage', 'content.manage', 'rewards.manage', 'team.read', 'analytics.read'],
  finance: ['payments.read', 'payments.connect', 'analytics.read'],
  barista: [],
  viewer: ['analytics.read'],
};

export const hasPermission = (role: MemberRole, permission: Permission) =>
  rolePermissions[role].includes(permission);
