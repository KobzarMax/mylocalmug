import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAccount } from '../../../features/auth/AccountProvider';
import { ShopDetailScreen } from '../../../features/marketplace/components/ShopDetailScreen';

export default function ShopRoute() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const { session } = useAccount();
  return (
    <ShopDetailScreen
      accountId={session!.user.id}
      businessId={businessId}
      onBack={() => router.back()}
      onOpenContent={(contentId) => router.push({ pathname: '/content/[contentId]', params: { contentId } })}
    />
  );
}
