import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import {
  clearPendingConfirmationEmail,
  createSessionFromAuthUrl,
  getPendingConfirmationEmail,
  registerAccount,
  resendAccountConfirmation,
  savePendingConfirmationEmail,
  signInAccount,
  verifyAccountEmailOtp,
} from './api';
import { AuthMode } from './types';
import { emailOtpSchema, pendingEmailSchema, registrationSchema, signInSchema } from './validation';

export function useAuthFlow() {
  const callbackUrl = Linking.useLinkingURL();
  const handledUrl = useRef<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [mode, setModeState] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    getPendingConfirmationEmail()
      .then((storedEmail) => {
        if (storedEmail && pendingEmailSchema.safeParse(storedEmail).success) {
          setEmail(storedEmail);
          setPendingEmail(storedEmail);
        }
      })
      .finally(() => setInitializing(false));
  }, []);

  useEffect(() => {
    if (initializing || !callbackUrl || handledUrl.current === callbackUrl) return;
    handledUrl.current = callbackUrl;
    setBusy(true);
    setError(null);
    createSessionFromAuthUrl(callbackUrl)
      .then(async (session) => {
        if (!session) return;
        await clearPendingConfirmationEmail();
        setPendingEmail(null);
        setNotice('Email confirmed. Your account is ready.');
      })
      .catch((caught) => setError(messageFrom(caught, 'Could not confirm this email link. Request a new email or use the code.')))
      .finally(() => setBusy(false));
  }, [callbackUrl, initializing]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async () => {
    setError(null);
    setNotice(null);
    const cleanEmail = email.trim().toLowerCase();
    if (mode === 'login') {
      const parsed = signInSchema.safeParse({ email: cleanEmail, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Check the account details.');
        return;
      }
      setBusy(true);
      try {
        await signInAccount(parsed.data.email, parsed.data.password);
        await clearPendingConfirmationEmail();
      } catch (caught) {
        if (errorCodeFrom(caught) === 'email_not_confirmed') {
          await savePendingConfirmationEmail(parsed.data.email);
          setPendingEmail(parsed.data.email);
          setNotice('Confirm your email before signing in. Request a new message if the old link expired.');
        } else {
          setError(messageFrom(caught, 'Could not sign in.'));
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsed = registrationSchema.safeParse({ displayName: displayName.trim(), email: cleanEmail, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the account details.');
      return;
    }
    setBusy(true);
    try {
      const result = await registerAccount(parsed.data.email, parsed.data.password, parsed.data.displayName);
      if (result.requiresEmailConfirmation) {
        await savePendingConfirmationEmail(parsed.data.email);
        setPendingEmail(parsed.data.email);
        setCooldown(60);
        setNotice('Confirmation email sent. Use the newest link or enter its numeric code.');
      } else {
        await clearPendingConfirmationEmail();
      }
    } catch (caught) {
      setError(messageFrom(caught, 'Could not create the account.'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!pendingEmail || cooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      await resendAccountConfirmation(pendingEmail);
      setCooldown(60);
      setNotice('A new confirmation email was sent. Older links and codes may no longer work.');
    } catch (caught) {
      setError(messageFrom(caught, 'Could not resend the confirmation email.'));
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!pendingEmail) return;
    const parsed = emailOtpSchema.safeParse(otp);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter the confirmation code.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await verifyAccountEmailOtp(pendingEmail, parsed.data);
      if (!session) throw new Error('The code was accepted without creating a session. Sign in again.');
      await clearPendingConfirmationEmail();
      setPendingEmail(null);
    } catch (caught) {
      setError(messageFrom(caught, 'The confirmation code is invalid or expired.'));
    } finally {
      setBusy(false);
    }
  };

  const showConfirmation = async () => {
    const parsed = pendingEmailSchema.safeParse(email.trim().toLowerCase());
    if (!parsed.success) {
      setError('Enter the email address you registered.');
      return;
    }
    await savePendingConfirmationEmail(parsed.data);
    setPendingEmail(parsed.data);
    setError(null);
    setNotice(null);
  };

  const setMode = (nextMode: AuthMode) => {
    setModeState(nextMode);
    setError(null);
    setNotice(null);
  };

  const backToLogin = () => {
    setModeState('login');
    setPendingEmail(null);
    setOtp('');
    setError(null);
    setNotice(null);
  };

  return {
    initializing, mode, setMode, displayName, setDisplayName, email, setEmail, password,
    setPassword, otp, setOtp, pendingEmail, busy, cooldown, error, notice, submit, resend,
    verifyOtp, showConfirmation, backToLogin,
  };
}

function messageFrom(caught: unknown, fallback: string) {
  return caught instanceof Error && caught.message ? caught.message : fallback;
}

function errorCodeFrom(caught: unknown) {
  if (!caught || typeof caught !== 'object' || !('code' in caught)) return null;
  return typeof caught.code === 'string' ? caught.code : null;
}
