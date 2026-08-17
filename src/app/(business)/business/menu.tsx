import { useLocalSearchParams, useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { MenuEntry } from '../../../features/menu/MenuEntry';

export default function BusinessMenuRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string }>();
  return (
    <RequireBusinessWorkspace permission="menu.manage">
      {(workspace) => (
        <MenuEntry
          workspace={workspace}
          initialAction={params.create === 'item' ? 'item' : undefined}
          onBack={() => router.back()}
        />
      )}
    </RequireBusinessWorkspace>
  );
}
