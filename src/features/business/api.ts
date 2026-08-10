import { BusinessApplicationInput } from '../../lib/businessValidation';
import { supabase } from '../../lib/supabase';
import { Application, Business, BusinessLocation, DayHours, MemberRole, Workspace } from './types';

export async function getBusinessWorkspace(userId: string): Promise<Workspace | null> {
  const membership = await supabase
    .from('business_memberships')
    .select('business_id, role')
    .eq('profile_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (membership.error) throw membership.error;
  if (!membership.data) return null;

  const businessId = membership.data.business_id as string;
  const [businessResult, locationResult] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, name, description, category, contact_email, contact_phone, website_url, address, logo_url, header_url, status, is_published')
      .eq('id', businessId)
      .single(),
    supabase
      .from('business_locations')
      .select('id, address, phone')
      .eq('business_id', businessId)
      .eq('is_primary', true)
      .maybeSingle(),
  ]);
  if (businessResult.error) throw businessResult.error;

  const row = businessResult.data;
  const business: Business = {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    websiteUrl: row.website_url,
    address: row.address,
    logoUrl: row.logo_url,
    headerUrl: row.header_url,
    status: row.status,
    isPublished: row.is_published,
  };
  const location: BusinessLocation | null = locationResult.data
    ? { id: locationResult.data.id, address: locationResult.data.address, phone: locationResult.data.phone }
    : null;
  return { business, location, role: membership.data.role as MemberRole };
}

export async function getBusinessApplication(userId: string): Promise<Application | null> {
  const result = await supabase
    .from('business_applications')
    .select('id, status, trading_name, legal_name, description, category, contact_email, contact_phone, website_url, address, company_number, vat_number, rejection_reason')
    .eq('applicant_id', userId)
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;
  const row = result.data;
  return {
    id: row.id,
    status: row.status,
    tradingName: row.trading_name,
    legalName: row.legal_name,
    description: row.description,
    category: row.category,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    websiteUrl: row.website_url,
    address: row.address,
    companyNumber: row.company_number,
    vatNumber: row.vat_number,
    rejectionReason: row.rejection_reason,
  };
}

const applicationPayload = (userId: string, input: BusinessApplicationInput) => ({
  applicant_id: userId,
  trading_name: input.tradingName,
  legal_name: input.legalName,
  description: input.description,
  category: input.category,
  contact_email: input.contactEmail,
  contact_phone: input.contactPhone,
  website_url: input.websiteUrl,
  address: input.address,
  company_number: input.companyNumber,
  vat_number: input.vatNumber,
  updated_at: new Date().toISOString(),
});

export async function saveBusinessApplication(userId: string, applicationId: string, input: BusinessApplicationInput) {
  const payload = applicationPayload(userId, input);
  const result = applicationId
    ? await supabase.from('business_applications').update(payload).eq('id', applicationId).select('id').single()
    : await supabase.from('business_applications').insert({ ...payload, status: 'draft' }).select('id').single();
  if (result.error) throw result.error;
  return result.data.id as string;
}

export async function submitBusinessApplication(applicationId: string) {
  const { error } = await supabase.rpc('submit_business_application', { target_application_id: applicationId });
  if (error) throw error;
}

export async function getBusinessHours(locationId: string) {
  const result = await supabase
    .from('business_hours')
    .select('day_of_week, opens_at, closes_at, is_closed')
    .eq('location_id', locationId)
    .order('day_of_week');
  if (result.error) throw result.error;
  return result.data;
}

export async function saveBusinessProfile(
  workspace: Workspace,
  input: { name: string; description: string; category: string; contactEmail: string; contactPhone: string; websiteUrl: string; address: string },
  published: boolean,
  hours: DayHours[],
  media: { logoUrl: string | null; headerUrl: string | null },
) {
  const businessResult = await supabase.from('businesses').update({
    name: input.name,
    description: input.description,
    category: input.category,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    website_url: input.websiteUrl,
    address: input.address,
    logo_url: media.logoUrl,
    header_url: media.headerUrl,
    is_published: published,
    status: published ? 'active' : workspace.business.status,
    updated_at: new Date().toISOString(),
  }).eq('id', workspace.business.id);
  if (businessResult.error) throw businessResult.error;

  const locationPayload = {
    business_id: workspace.business.id,
    name: 'Main location',
    address: input.address,
    phone: input.contactPhone,
    is_primary: true,
    updated_at: new Date().toISOString(),
  };
  const locationResult = workspace.location
    ? await supabase.from('business_locations').update(locationPayload).eq('id', workspace.location.id).select('id').single()
    : await supabase.from('business_locations').insert(locationPayload).select('id').single();
  if (locationResult.error) throw locationResult.error;

  const hoursResult = await supabase.from('business_hours').upsert(hours.map((day) => ({
    location_id: locationResult.data.id,
    day_of_week: day.dayOfWeek,
    opens_at: day.isClosed ? null : day.opensAt,
    closes_at: day.isClosed ? null : day.closesAt,
    is_closed: day.isClosed,
  })));
  if (hoursResult.error) throw hoursResult.error;
}
