import { useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { RewardsEntry } from '../../../features/rewards/RewardsEntry';

export default function BusinessRewardsRoute() {
  const router = useRouter();
  return (
    <RequireBusinessWorkspace permission={['rewards.manage', 'loyalty.issue']}>
      {(workspace) => <RewardsEntry workspace={workspace} onBack={() => router.back()} />}
    </RequireBusinessWorkspace>
  );
}
