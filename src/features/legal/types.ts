export type UkLegalEntityType =
  | 'sole_trader'
  | 'limited_company'
  | 'limited_liability_partnership'
  | 'partnership'
  | 'charity'
  | 'other_organisation';

export type LegalProfileStatus = 'draft' | 'pending_approval' | 'approved';

export type BusinessLegalProfileInput = {
  entityType: UkLegalEntityType;
  legalName: string;
  tradingName: string;
  registeredAddressLine1: string;
  registeredAddressLine2: string;
  registeredTownCity: string;
  registeredCounty: string;
  registeredPostcode: string;
  contactEmail: string;
  contactPhone: string;
  companyNumber: string;
  charityNumber: string;
  vatRegistered: boolean;
  vatNumber: string;
};

export type BusinessLegalProfile = BusinessLegalProfileInput & {
  businessId: string;
  country: 'GB';
  status: LegalProfileStatus;
  revision: number;
  changeRequestNote: string;
  lastEditedBy: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  updatedAt: string;
};

export const ENTITY_OPTIONS: { value: UkLegalEntityType; label: string }[] = [
  { value: 'sole_trader', label: 'Sole trader' },
  { value: 'limited_company', label: 'Limited company' },
  { value: 'limited_liability_partnership', label: 'Limited liability partnership' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'charity', label: 'Charity' },
  { value: 'other_organisation', label: 'Other organisation' },
];
