import { useRouter } from 'expo-router';

import { useAccount } from '../../../features/auth/AccountProvider';
import { CustomerRewardsEntry } from '../../../features/rewards/CustomerRewardsEntry';

export default function RewardsRoute() {
  const router = useRouter();
  const { session } = useAccount();
  return (
    <CustomerRewardsEntry
      accountId={session!.user.id}
      onEarn={(businessId) => router.push({ pathname: '/reward/earn/[businessId]', params: { businessId } })}
      onRedeem={(offer) =>
        router.push({
          pathname: '/reward/redeem/[offerId]',
          params: { offerId: offer.id, businessId: offer.businessId },
        })
      }
    />
  );
}
