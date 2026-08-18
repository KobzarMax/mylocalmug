import { useLocalSearchParams, useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../../features/business/RequireBusinessWorkspace';
import { CategoryManagerEntry } from '../../../../features/menu/CategoryManagerEntry';

export default function BusinessMenuCategoriesRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string }>();
  return (
    <RequireBusinessWorkspace permission="menu.manage">
      {(workspace) => (
        <CategoryManagerEntry
          workspace={workspace}
          initialCreate={params.create === 'category'}
          onBack={() => router.back()}
        />
      )}
    </RequireBusinessWorkspace>
  );
}
