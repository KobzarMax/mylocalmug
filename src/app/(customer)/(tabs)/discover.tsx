import { useRouter } from 'expo-router';

import { useAccount } from '../../../features/auth/AccountProvider';
import { MarketplaceEntry } from '../../../features/marketplace/MarketplaceEntry';

export default function DiscoverRoute() {
  const router = useRouter();
  const { profile } = useAccount();
  return (
    <MarketplaceEntry
      displayName={profile?.display_name ?? 'there'}
      onOpenBusiness={(businessId) => router.push({ pathname: '/shop/[businessId]', params: { businessId } })}
    />
  );
}
