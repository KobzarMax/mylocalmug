import { useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { TeamEntry } from '../../../features/team/TeamEntry';

export default function BusinessTeamRoute() {
  const router = useRouter();
  return (
    <RequireBusinessWorkspace permission="team.read">
      {(workspace) => <TeamEntry workspace={workspace} onBack={() => router.back()} />}
    </RequireBusinessWorkspace>
  );
}
