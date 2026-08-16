import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

import { BusinessLegalProfile, BusinessLegalProfileInput } from './types';

export async function getLegalProfile(businessId: string) {
  const result = await supabase.rpc('get_business_legal_profile', { target_business_id: businessId });
  if (result.error) throw result.error;
  return mapProfile(result.data);
}

export async function saveLegalProfile(
  businessId: string,
  revision: number,
  input: BusinessLegalProfileInput,
) {
  const result = await supabase.rpc('save_business_legal_profile', {
    target_business_id: businessId,
    expected_revision: revision,
    profile_input: toPayload(input),
  });
  if (result.error) throw result.error;
  return mapProfile(result.data);
}

export async function submitLegalProfile(businessId: string, revision: number) {
  const result = await supabase.rpc('submit_business_legal_profile', {
    target_business_id: businessId,
    expected_revision: revision,
  });
  if (result.error) throw result.error;
  return mapProfile(result.data);
}

export async function approveLegalProfile(businessId: string, revision: number) {
  const result = await supabase.rpc('approve_business_legal_profile', {
    target_business_id: businessId,
    expected_revision: revision,
    authority_attested: true,
  });
  if (result.error) throw result.error;
  return mapProfile(result.data);
}

export async function requestLegalProfileChanges(businessId: string, revision: number, note: string) {
  const result = await supabase.rpc('request_business_legal_profile_changes', {
    target_business_id: businessId,
    expected_revision: revision,
    review_note: note.trim(),
  });
  if (result.error) throw result.error;
  return mapProfile(result.data);
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

type LegalProfileRow = Database['public']['Functions']['get_business_legal_profile']['Returns'];

function mapProfile(row: LegalProfileRow): BusinessLegalProfile {
  return {
    businessId: row.business_id,
    country: 'GB',
    entityType: row.entity_type as BusinessLegalProfile['entityType'],
    legalName: row.legal_name,
    tradingName: row.trading_name,
    registeredAddressLine1: row.registered_address_line1,
    registeredAddressLine2: row.registered_address_line2,
    registeredTownCity: row.registered_town_city,
    registeredCounty: row.registered_county,
    registeredPostcode: row.registered_postcode,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    companyNumber: row.company_number,
    charityNumber: row.charity_number,
    vatRegistered: row.vat_registered,
    vatNumber: row.vat_number,
    status: row.status as BusinessLegalProfile['status'],
    revision: row.revision,
    changeRequestNote: row.change_request_note,
    lastEditedBy: row.last_edited_by,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    updatedAt: row.updated_at,
  };
}
