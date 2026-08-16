import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerRewardQr } from '../../../../features/rewards/components/CustomerRewardQr';
import { rewardStyles } from '../../../../features/rewards/styles';

export default function EarningQrRoute() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  return (
    <SafeAreaView style={rewardStyles.safe}>
      <CustomerRewardQr businessId={businessId} offer={null} onBack={() => router.back()} />
    </SafeAreaView>
  );
}
