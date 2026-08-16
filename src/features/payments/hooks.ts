import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';

import { hasPermission } from '../business/permissions';
import { Workspace } from '../business/types';

import {
  listPaymentConnections,
  refreshPaymentConnection,
  startPayPalOnboarding,
  startStripeOnboarding,
} from './api';
import { PaymentConnection, PaymentProvider } from './types';

export function usePaymentConnections(workspace: Workspace) {
  const [connections, setConnections] = useState<PaymentConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canRead = hasPermission(workspace.role, 'payments.read');
  const refresh = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setConnections(await listPaymentConnections(workspace.business.id));
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, [workspace.business.id, canRead]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const start = async (provider: PaymentProvider) => {
    setBusy(provider);
    setError(null);
    try {
      const result =
        provider === 'stripe'
          ? await startStripeOnboarding(workspace.business.id)
          : await startPayPalOnboarding(workspace.business.id);
      await WebBrowser.openBrowserAsync(result.url);
      await refresh();
    } catch (e) {
      setError(message(e));
      throw e;
    } finally {
      setBusy(null);
    }
  };
  const sync = async (provider: PaymentProvider) => {
    setBusy(provider);
    try {
      const next = await refreshPaymentConnection(workspace.business.id, provider);
      setConnections((current) => [...current.filter((item) => item.provider !== provider), next]);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(null);
    }
  };
  return {
    connections,
    loading,
    busy,
    error,
    refresh,
    start,
    sync,
    canConnect: hasPermission(workspace.role, 'payments.connect'),
    canRead,
  };
}
function message(error: unknown) {
  return error instanceof Error ? error.message : 'Payment setup is unavailable.';
}
