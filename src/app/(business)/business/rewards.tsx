import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { Workspace } from '../../../features/business/types';
import { RewardsEntry } from '../../../features/rewards/RewardsEntry';
import { rewardKeys } from '../../../features/rewards/hooks';

export default function BusinessRewardsRoute() {
  const router = useRouter();
  return (
    <RequireBusinessWorkspace permission={['rewards.manage', 'loyalty.issue']}>
      {(workspace) => <FocusedRewards workspace={workspace} onBack={() => router.back()} />}
    </RequireBusinessWorkspace>
  );
}

function FocusedRewards({ workspace, onBack }: { workspace: Workspace; onBack: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [navigationVersion, setNavigationVersion] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setNavigationVersion((value) => value + 1);
      void queryClient.invalidateQueries({ queryKey: rewardKeys.business(workspace.business.id) });
    }, [queryClient, workspace.business.id]),
  );
  return (
    <RewardsEntry
      workspace={workspace}
      onBack={onBack}
      navigationVersion={navigationVersion}
      onCreateEvent={() => router.push({ pathname: '/business/content', params: { create: 'event' } })}
      onCreateMenuItem={() => router.push({ pathname: '/business/menu', params: { create: 'item' } })}
    />
  );
}
