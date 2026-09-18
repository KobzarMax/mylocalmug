import { useLocalSearchParams, useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { SocialConnectionsScreen } from '../../../features/social/components/SocialConnectionsScreen';

export default function SocialConnectionsRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ session?: string }>();
  return (
    <RequireBusinessWorkspace permission="social.connect">
      {(workspace) => (
        <SocialConnectionsScreen
          businessId={workspace.business.id}
          sessionId={params.session}
          onBack={() => router.back()}
        />
      )}
    </RequireBusinessWorkspace>
  );
}
