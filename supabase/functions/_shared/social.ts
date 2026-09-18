import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.0';

export const required = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

export const serviceClient = () => createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });

export async function userClient(token: string) {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
}

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
export const randomToken = () => bytesToBase64(crypto.getRandomValues(new Uint8Array(32))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
export async function sha256(value: string) { return bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))); }

export async function encryptSecret(value: string) {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, await encryptionKey(), new TextEncoder().encode(value));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), nonce: bytesToBase64(nonce) };
}

export async function decryptSecret(ciphertext: string, nonce: string) {
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(nonce) }, await encryptionKey(), base64ToBytes(ciphertext));
  return new TextDecoder().decode(clear);
}

async function encryptionKey() {
  const bytes = base64ToBytes(required('SOCIAL_TOKEN_ENCRYPTION_KEY'));
  if (bytes.byteLength !== 32) throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY must decode to 32 bytes');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

function bytesToBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); }
