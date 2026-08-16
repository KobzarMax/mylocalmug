import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { safeErrorMessage } from '../../lib/errors';

import { getAccountProfile, getCurrentSession, signOutAccount, subscribeToSessionChanges } from './api';
import { AccountProfile } from './types';

export function useAuthenticatedAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let receivedSessionChange = false;
    getCurrentSession()
      .then((current) => {
        if (active && !receivedSessionChange) setSession(current);
      })
      .catch((caught) => {
        if (active) setProfileError(messageFrom(caught, 'Could not restore the session.'));
      })
      .finally(() => {
        if (active) setLoadingSession(false);
      });
    const unsubscribe = subscribeToSessionChanges((nextSession) => {
      if (!active) return;
      receivedSessionChange = true;
      setSession(nextSession);
      if (!nextSession) setProfile(null);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    setProfileError(null);
    try {
      setProfile(await getAccountProfile(session.user));
    } catch (caught) {
      setProfileError(messageFrom(caught, 'Could not load the account profile.'));
    }
  }, [session]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const signOut = async () => {
    setProfileError(null);
    try {
      await signOutAccount();
    } catch (caught) {
      setProfileError(messageFrom(caught, 'Could not sign out.'));
    }
  };

  return {
    session,
    profile,
    setProfile,
    loadingSession,
    profileError,
    reloadProfile: loadProfile,
    signOut,
  };
}

function messageFrom(caught: unknown, fallback: string) {
  return safeErrorMessage(caught, fallback);
}
