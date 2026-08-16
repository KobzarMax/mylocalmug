import { useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { BusinessContentEntry } from '../../../features/content/BusinessContentEntry';

export default function BusinessContentRoute() {
  const router = useRouter();
  return (
    <RequireBusinessWorkspace permission="content.manage">
      {(workspace) => <BusinessContentEntry workspace={workspace} onBack={() => router.back()} />}
    </RequireBusinessWorkspace>
  );
}
