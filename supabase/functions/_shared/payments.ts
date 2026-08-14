import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.0';

export const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type, stripe-signature, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo',
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'content-type': 'application/json' } });
}

export function serviceClient() {
  const url = required('SUPABASE_URL');
  return createClient(url, required('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticatedUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Authentication required.');
  const result = await serviceClient().auth.getUser(token);
  if (result.error || !result.data.user) throw new HttpError(401, 'Authentication required.');
  return { user: result.data.user, token };
}

export async function requireBusinessAccess(profileId: string, businessId: string, roles: string[]) {
  const db = serviceClient();
  const membership = await db.from('business_memberships').select('role,status').eq('business_id', businessId).eq('profile_id', profileId).maybeSingle();
  if (membership.error || !membership.data || membership.data.status !== 'active' || !roles.includes(membership.data.role)) throw new HttpError(403, 'Business access required.');
  return membership.data;
}

export async function stripeRequest(path: string, init: { method?: string; body?: URLSearchParams; account?: string; idempotencyKey?: string } = {}) {
  const headers: Record<string, string> = { authorization: `Bearer ${required('STRIPE_SECRET_KEY')}` };
  if (init.body) headers['content-type'] = 'application/x-www-form-urlencoded';
  if (init.account) headers['stripe-account'] = init.account;
  if (init.idempotencyKey) headers['idempotency-key'] = init.idempotencyKey;
  const response = await fetch(`https://api.stripe.com/v1${path}`, { method: init.method ?? 'GET', headers, body: init.body });
  const data = await response.json();
  if (!response.ok) throw new HttpError(502, safeProviderMessage(data, 'Stripe request failed.'));
  return data as Record<string, unknown>;
}

export function paypalBase() { return Deno.env.get('PAYPAL_ENVIRONMENT') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'; }

export async function paypalToken() {
  const credentials = btoa(`${required('PAYPAL_CLIENT_ID')}:${required('PAYPAL_CLIENT_SECRET')}`);
  const response = await fetch(`${paypalBase()}/v1/oauth2/token`, { method: 'POST', headers: { authorization: `Basic ${credentials}`, 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new HttpError(502, 'PayPal authentication failed.');
  return String(data.access_token);
}

export async function paypalRequest(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}) {
  const headers: Record<string, string> = { authorization: `Bearer ${await paypalToken()}`, 'content-type': 'application/json' };
  if (init.idempotencyKey) headers['paypal-request-id'] = init.idempotencyKey;
  const response = await fetch(`${paypalBase()}${path}`, { method: init.method ?? 'GET', headers, body: init.body ? JSON.stringify(init.body) : undefined });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new HttpError(502, safeProviderMessage(data, 'PayPal request failed.'));
  return data as Record<string, unknown>;
}

export async function sha256(value: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

function safeProviderMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const record = data as Record<string, unknown>;
  const error = record.error && typeof record.error === 'object' ? record.error as Record<string, unknown> : null;
  return String(error?.message ?? record.message ?? fallback).slice(0, 300);
}
