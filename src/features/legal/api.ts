import { supabase } from '../../lib/supabase';
import { BusinessLegalProfile, BusinessLegalProfileInput } from './types';

export async function getLegalProfile(businessId: string) {
  const result = await supabase.rpc('get_business_legal_profile', { target_business_id: businessId });
  if (result.error) throw result.error;
  return mapProfile(result.data as Record<string, unknown>);
}

export async function saveLegalProfile(businessId: string, revision: number, input: BusinessLegalProfileInput) {
  return callProfileRpc('save_business_legal_profile', {
    target_business_id: businessId,
    expected_revision: revision,
    profile_input: toPayload(input),
  });
}

export async function submitLegalProfile(businessId: string, revision: number) {
  return callProfileRpc('submit_business_legal_profile', { target_business_id: businessId, expected_revision: revision });
}

export async function approveLegalProfile(businessId: string, revision: number) {
  return callProfileRpc('approve_business_legal_profile', {
    target_business_id: businessId,
    expected_revision: revision,
    authority_attested: true,
  });
}

export async function requestLegalProfileChanges(businessId: string, revision: number, note: string) {
  return callProfileRpc('request_business_legal_profile_changes', {
    target_business_id: businessId,
    expected_revision: revision,
    review_note: note.trim(),
  });
}

async function callProfileRpc(name: string, parameters: Record<string, unknown>) {
  const result = await supabase.rpc(name, parameters);
  if (result.error) throw result.error;
  return mapProfile(result.data as Record<string, unknown>);
}

function toPayload(input: BusinessLegalProfileInput) {
  return {
    entity_type: input.entityType,
    legal_name: input.legalName,
    trading_name: input.tradingName,
    registered_address_line1: input.registeredAddressLine1,
    registered_address_line2: input.registeredAddressLine2,
    registered_town_city: input.registeredTownCity,
    registered_county: input.registeredCounty,
    registered_postcode: input.registeredPostcode,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    company_number: input.companyNumber,
    charity_number: input.charityNumber,
    vat_registered: input.vatRegistered,
    vat_number: input.vatNumber,
  };
}

function mapProfile(row: Record<string, unknown>): BusinessLegalProfile {
  return {
    businessId: String(row.business_id),
    country: 'GB',
    entityType: row.entity_type as BusinessLegalProfile['entityType'],
    legalName: String(row.legal_name ?? ''),
    tradingName: String(row.trading_name ?? ''),
    registeredAddressLine1: String(row.registered_address_line1 ?? ''),
    registeredAddressLine2: String(row.registered_address_line2 ?? ''),
    registeredTownCity: String(row.registered_town_city ?? ''),
    registeredCounty: String(row.registered_county ?? ''),
    registeredPostcode: String(row.registered_postcode ?? ''),
    contactEmail: String(row.contact_email ?? ''),
    contactPhone: String(row.contact_phone ?? ''),
    companyNumber: String(row.company_number ?? ''),
    charityNumber: String(row.charity_number ?? ''),
    vatRegistered: Boolean(row.vat_registered),
    vatNumber: String(row.vat_number ?? ''),
    status: row.status as BusinessLegalProfile['status'],
    revision: Number(row.revision),
    changeRequestNote: String(row.change_request_note ?? ''),
    lastEditedBy: row.last_edited_by ? String(row.last_edited_by) : null,
    submittedBy: row.submitted_by ? String(row.submitted_by) : null,
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    updatedAt: String(row.updated_at),
  };
}
