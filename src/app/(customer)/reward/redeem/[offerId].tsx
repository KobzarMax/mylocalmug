import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StateView } from '../../../../components/ui/StateView';
import { useAccount } from '../../../../features/auth/AccountProvider';
import { CustomerRewardQr } from '../../../../features/rewards/components/CustomerRewardQr';
import { useCustomerRewards } from '../../../../features/rewards/hooks';
import { rewardStyles } from '../../../../features/rewards/styles';

export default function RedemptionQrRoute() {
  const router = useRouter();
  const { offerId, businessId } = useLocalSearchParams<{ offerId: string; businessId: string }>();
  const { session } = useAccount();
  const rewards = useCustomerRewards(session!.user.id);
  if (rewards.loading) return <StateView kind="loading" title="Preparing reward…" />;
  const offer = rewards.offers.find((item) => item.id === offerId);
  if (!offer)
    return (
      <StateView kind="error" title="Reward unavailable" message="This reward is no longer available." />
    );
  return (
    <SafeAreaView style={rewardStyles.safe}>
      <CustomerRewardQr businessId={businessId} offer={offer} onBack={() => router.back()} />
    </SafeAreaView>
  );
}
