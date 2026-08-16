import 'react-native-url-polyfill/auto';

import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '../components/ui/AppErrorBoundary';
import { AccountProvider, useAccount } from '../features/auth/AccountProvider';
import { subscribeToContentNotifications } from '../features/content/device';
import { usePushDeviceRefresh } from '../features/content/hooks';
import { LocalQueryProvider, useAccountCacheBoundary } from '../lib/query/QueryProvider';

function AppBootstrap() {
  const router = useRouter();
  const { session } = useAccount();
  usePushDeviceRefresh(Boolean(session));
  useAccountCacheBoundary(session?.user.id ?? null);

  useEffect(() => {
    const subscription = subscribeToContentNotifications((contentId) => {
      router.push({ pathname: '/content/[contentId]', params: { contentId } });
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocalQueryProvider>
        <AccountProvider>
          <AppBootstrap />
          <AppErrorBoundary>
            <Stack screenOptions={{ headerShown: false }} />
          </AppErrorBoundary>
        </AccountProvider>
      </LocalQueryProvider>
    </SafeAreaProvider>
  );
}
