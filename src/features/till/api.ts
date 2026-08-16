import { supabase } from '../../lib/supabase';

import { TerminalLocation, TerminalReader } from './types';
export async function listTerminalLocations(businessId: string) {
  const result = await supabase
    .from('terminal_locations')
    .select('*')
    .eq('business_id', businessId)
    .eq('active', true);
  if (result.error) throw result.error;
  return (result.data as Record<string, unknown>[]).map(
    (row) =>
      ({
        id: String(row.id),
        businessId: String(row.business_id),
        businessLocationId: String(row.business_location_id),
        providerLocationId: String(row.provider_location_id),
        active: Boolean(row.active),
      }) as TerminalLocation,
  );
}
export async function listTerminalReaders(businessId: string) {
  const result = await supabase.from('terminal_readers').select('*').eq('business_id', businessId);
  if (result.error) throw result.error;
  return (result.data as Record<string, unknown>[]).map(
    (row) =>
      ({
        id: String(row.id),
        businessId: String(row.business_id),
        terminalLocationId: String(row.terminal_location_id),
        providerReaderId: String(row.provider_reader_id),
        label: String(row.label),
        deviceType: String(row.device_type),
        status: String(row.status),
        lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : null,
      }) as TerminalReader,
  );
}
