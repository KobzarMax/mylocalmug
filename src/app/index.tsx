import { Redirect } from 'expo-router';

import { StateView } from '../components/ui/StateView';
import { useAccount } from '../features/auth/AccountProvider';

export default function IndexRoute() {
  const { loadingSession, session } = useAccount();
  if (loadingSession) return <StateView kind="loading" title="Opening Local Mug…" />;
  return <Redirect href={session ? '/discover' : '/sign-in'} />;
}
