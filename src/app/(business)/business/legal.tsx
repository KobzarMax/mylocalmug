import { useRouter } from 'expo-router';

import { RequireBusinessWorkspace } from '../../../features/business/RequireBusinessWorkspace';
import { LegalEntry } from '../../../features/legal/LegalEntry';

export default function BusinessLegalRoute() {
  const router = useRouter();
  return (
    <RequireBusinessWorkspace permission="legal.read">
      {(workspace) => <LegalEntry workspace={workspace} onBack={() => router.back()} />}
    </RequireBusinessWorkspace>
  );
}
