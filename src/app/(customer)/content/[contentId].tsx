import { useLocalSearchParams, useRouter } from 'expo-router';

import { StateView } from '../../../components/ui/StateView';
import { useAccount } from '../../../features/auth/AccountProvider';
import { ContentDetailScreen } from '../../../features/content/components/ContentDetailScreen';
import { useContentDetail } from '../../../features/content/hooks';

export default function ContentRoute() {
  const router = useRouter();
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const { session } = useAccount();
  const detail = useContentDetail(contentId);
  if (detail.loading) return <StateView kind="loading" title="Opening story…" />;
  if (!detail.item || detail.error)
    return (
      <StateView
        kind="error"
        title="Story unavailable"
        message={detail.error ?? 'This story could not be found.'}
        onRetry={detail.refresh}
      />
    );
  return (
    <ContentDetailScreen
      accountId={session!.user.id}
      item={detail.item}
      isOnline={detail.isOnline}
      dataUpdatedAt={detail.dataUpdatedAt}
      onBack={() => router.back()}
      onMoreFromBusiness={() => router.replace('/news')}
    />
  );
}
