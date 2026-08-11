import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EmailOtpType, Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { AccountProfile, RegistrationResult } from './types';

const pendingEmailKey = 'local-mug:pending-confirmation-email';
export const authRedirectUrl = 'localmug://auth/confirm';

export async function registerAccount(email: string, password: string, displayName: string): Promise<RegistrationResult> {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: authRedirectUrl,
    },
  });
  if (result.error) throw result.error;
  return { requiresEmailConfirmation: !result.data.session };
}

export async function signInAccount(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data.session;
}

export async function resendAccountConfirmation(email: string) {
  const result = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: authRedirectUrl },
  });
  if (result.error) throw result.error;
}

export async function verifyAccountEmailOtp(email: string, token: string) {
  const result = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (result.error) throw result.error;
  return result.data.session;
}

export async function getCurrentSession() {
  const result = await supabase.auth.getSession();
  if (result.error) throw result.error;
  return result.data.session;
}

export function subscribeToSessionChanges(listener: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}

export async function signOutAccount() {
  const result = await supabase.auth.signOut();
  if (result.error) throw result.error;
}

export async function getAccountProfile(user: User): Promise<AccountProfile> {
  const result = await supabase
    .from('profiles')
    .select('id, role, display_name, description, avatar_path')
    .eq('id', user.id)
    .maybeSingle();
  if (result.error) throw result.error;
  if (result.data) return result.data as AccountProfile;

  const metadataName = typeof user.user_metadata?.display_name === 'string'
    ? user.user_metadata.display_name.trim().slice(0, 80)
    : '';
  const fallback: AccountProfile = {
    id: user.id,
    role: 'client',
    display_name: metadataName || user.email?.split('@')[0]?.slice(0, 80) || 'Coffee friend',
    description: '',
    avatar_path: null,
  };
  const created = await supabase.from('profiles').upsert(fallback).select('id, role, display_name, description, avatar_path').single();
  if (created.error) throw created.error;
  return created.data as AccountProfile;
}

export async function createSessionFromAuthUrl(url: string): Promise<Session | null> {
  const params = getAuthUrlParams(url);
  const errorDescription = params.get('error_description');
  const errorCode = params.get('error_code') ?? params.get('error');
  if (errorDescription || errorCode) {
    throw new Error(errorDescription ?? errorCode ?? 'Email confirmation failed.');
  }

  const code = params.get('code');
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error) throw result.error;
    return result.data.session;
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const result = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (result.error) throw result.error;
    return result.data.session;
  }

  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (tokenHash && isEmailOtpType(type)) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (result.error) throw result.error;
    return result.data.session;
  }

  return null;
}

export const getPendingConfirmationEmail = () => AsyncStorage.getItem(pendingEmailKey);
export const savePendingConfirmationEmail = (email: string) => AsyncStorage.setItem(pendingEmailKey, email);
export const clearPendingConfirmationEmail = () => AsyncStorage.removeItem(pendingEmailKey);

function getAuthUrlParams(url: string) {
  const [withoutHash, hash = ''] = url.split('#', 2);
  const query = withoutHash.includes('?') ? withoutHash.slice(withoutHash.indexOf('?') + 1) : '';
  return new URLSearchParams([query, hash].filter(Boolean).join('&'));
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && ['email', 'signup', 'invite', 'magiclink', 'recovery', 'email_change'].includes(value);
}
