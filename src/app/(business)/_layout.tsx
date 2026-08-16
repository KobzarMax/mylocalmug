import { Redirect, Stack } from 'expo-router';

import { StateView } from '../../components/ui/StateView';
import { useAccount } from '../../features/auth/AccountProvider';
import { BusinessWorkspaceProvider } from '../../features/business/BusinessWorkspaceProvider';

export default function BusinessLayout() {
  const account = useAccount();
  if (account.loadingSession || (account.session && !account.profile && !account.profileError))
    return <StateView kind="loading" title="Loading your account…" />;
  if (!account.session) return <Redirect href="/sign-in" />;
  if (account.profileError)
    return (
      <StateView
        kind="error"
        title="Account unavailable"
        message={account.profileError}
        onRetry={account.reloadProfile}
      />
    );
  return (
    <BusinessWorkspaceProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BusinessWorkspaceProvider>
  );
}
