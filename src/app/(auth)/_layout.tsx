import { Redirect, Stack } from 'expo-router';

import { StateView } from '../../components/ui/StateView';
import { useAccount } from '../../features/auth/AccountProvider';

export default function AuthLayout() {
  const { loadingSession, session } = useAccount();
  if (loadingSession) return <StateView kind="loading" title="Restoring your session…" />;
  if (session) return <Redirect href="/discover" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
