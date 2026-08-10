import { MemberRole } from '../business/types';

export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'removed';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type TeamMember = {
  profileId: string;
  displayName: string;
  avatarPath: string | null;
  role: MemberRole;
  status: MembershipStatus;
  joinedAt: string;
};

export type TeamInvitation = {
  id: string;
  businessId: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
};

export type CreatedInvitation = {
  id: string;
  token: string;
  email: string;
  role: MemberRole;
  expiresAt: string;
};

export const assignableRoles: { value: Exclude<MemberRole, 'owner'>; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Manages the business and team.' },
  { value: 'manager', label: 'Manager', description: 'Manages profile, menu, content, and rewards.' },
  { value: 'finance', label: 'Finance', description: 'Views payments, refunds, and reporting.' },
  { value: 'barista', label: 'Barista', description: 'Takes payments and issues loyalty stamps.' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only reporting access.' },
];
