import { useLocalSearchParams, useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { BusinessContentEntry } from '../../../features/content/BusinessContentEntry';

export default function BusinessContentRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string }>();
  return (
    <RequireBusinessWorkspace permission="content.manage">
      {(workspace) => (
        <BusinessContentEntry
          workspace={workspace}
          initialCreateKind={params.create === 'event' ? 'event' : undefined}
          onBack={() => router.back()}
        />
      )}
    </RequireBusinessWorkspace>
  );
}
