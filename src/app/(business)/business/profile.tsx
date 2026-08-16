import { useRouter } from 'expo-router';

import { useBusinessWorkspace } from '../../../features/business/BusinessWorkspaceProvider';
import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { BusinessProfileEditor } from '../../../features/business/components/BusinessProfileEditor';

export default function BusinessProfileRoute() {
  const router = useRouter();
  const access = useBusinessWorkspace();
  return (
    <RequireBusinessWorkspace permission="business.profile.write">
      {(workspace) => (
        <BusinessProfileEditor
          workspace={workspace}
          onBack={() => router.back()}
          onSaved={async () => {
            await access.refresh();
            router.back();
          }}
        />
      )}
    </RequireBusinessWorkspace>
  );
}
