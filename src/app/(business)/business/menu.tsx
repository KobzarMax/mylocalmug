import { useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { MenuEntry } from '../../../features/menu/MenuEntry';

export default function BusinessMenuRoute() {
  const router = useRouter();
  return (
    <RequireBusinessWorkspace permission="menu.manage">
      {(workspace) => <MenuEntry workspace={workspace} onBack={() => router.back()} />}
    </RequireBusinessWorkspace>
  );
}
