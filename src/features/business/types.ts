import { BusinessApplicationInput } from '../../lib/businessValidation';
import { ProfileImageMime } from '../../lib/profileValidation';

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
export type MemberRole = 'owner' | 'admin' | 'manager' | 'finance' | 'barista' | 'viewer';
export type Permission =
  | 'business.profile.read'
  | 'business.profile.write'
  | 'menu.manage'
  | 'content.manage'
  | 'rewards.manage'
  | 'team.read'
  | 'team.manage'
  | 'payments.read'
  | 'payments.charge'
  | 'payments.refund'
  | 'payments.connect'
  | 'orders.read'
  | 'orders.manage'
  | 'legal.read'
  | 'legal.write'
  | 'legal.approve'
  | 'loyalty.issue'
  | 'analytics.read'
  | 'ownership.transfer';

export type Application = BusinessApplicationInput & {
  id: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
};

export type ReviewApplication = Application & {
  applicantId: string;
  submittedAt: string | null;
};

export type Business = {
  id: string;
  name: string;
  description: string;
  category: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  address: string;
  logoUrl: string | null;
  headerUrl: string | null;
  status: 'onboarding' | 'active' | 'suspended' | 'closed';
  isPublished: boolean;
};

export type BusinessLocation = { id: string; address: string; phone: string; timezone: string };
export type Workspace = { business: Business; role: MemberRole; location: BusinessLocation | null };
export type DayHours = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean };
export type SelectedMedia = { uri: string; mimeType: ProfileImageMime };

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const createDefaultHours = (): DayHours[] => DAYS.map((_, dayOfWeek) => ({
  dayOfWeek,
  opensAt: '08:00',
  closesAt: dayOfWeek >= 5 ? '16:00' : '17:00',
  isClosed: dayOfWeek === 6,
}));

export const createEmptyApplication = (email: string): BusinessApplicationInput => ({
  tradingName: '',
  legalName: '',
  description: '',
  category: 'Independent coffee shop',
  contactEmail: email,
  contactPhone: '',
  websiteUrl: '',
  address: '',
  companyNumber: '',
  vatNumber: '',
});
