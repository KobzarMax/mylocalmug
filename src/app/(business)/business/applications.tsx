import { useRouter } from 'expo-router';

import { StateView } from '../../../components/ui/StateView';
import { useBusinessWorkspace } from '../../../features/business/BusinessWorkspaceProvider';
import { AdminReviewQueue } from '../../../features/business/components/AdminReviewQueue';

export default function BusinessApplicationsRoute() {
  const router = useRouter();
  const access = useBusinessWorkspace();
  if (access.loading) return <StateView kind="loading" title="Loading applications…" />;
  if (!access.isPlatformAdmin) return <StateView kind="error" title="Administrator access required" />;
  return <AdminReviewQueue onBack={() => router.back()} />;
}
