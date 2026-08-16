import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import { useCallback } from 'react';

import { getTerminalToken } from '../payments/api';

import { TillScreen } from './components/TillScreen';
export function TillEntry({ businessId }: { businessId: string }) {
  const tokenProvider = useCallback(async () => (await getTerminalToken(businessId)).secret, [businessId]);
  return (
    <StripeTerminalProvider logLevel="error" tokenProvider={tokenProvider}>
      <TillScreen businessId={businessId} />
    </StripeTerminalProvider>
  );
}
