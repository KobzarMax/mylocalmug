import { MemberRole, Permission } from './types';

const allPermissions: Permission[] = [
  'business.profile.read', 'business.profile.write', 'menu.manage', 'content.manage',
  'rewards.manage', 'team.read', 'team.manage', 'payments.read', 'payments.charge',
  'payments.refund', 'payments.connect', 'loyalty.issue', 'analytics.read',
  'legal.read', 'legal.write', 'legal.approve',
  'ownership.transfer',
];

const rolePermissions: Record<MemberRole, Permission[]> = {
  owner: allPermissions,
  admin: allPermissions.filter((permission) => permission !== 'ownership.transfer'),
  manager: ['business.profile.read', 'business.profile.write', 'menu.manage', 'content.manage', 'rewards.manage', 'team.read', 'analytics.read'],
  finance: ['business.profile.read', 'payments.read', 'payments.charge', 'payments.refund', 'payments.connect', 'analytics.read', 'legal.read', 'legal.write'],
  barista: ['business.profile.read', 'payments.charge', 'loyalty.issue'],
  viewer: ['business.profile.read', 'analytics.read'],
};

export const hasPermission = (role: MemberRole, permission: Permission) =>
  rolePermissions[role].includes(permission);
