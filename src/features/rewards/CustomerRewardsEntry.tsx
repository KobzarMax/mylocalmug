import { useState } from 'react';
import { SafeAreaView } from 'react-native';

import { CustomerRewardQr } from './components/CustomerRewardQr';
import { CustomerRewardsWallet } from './components/CustomerRewardsWallet';
import { useCustomerRewards } from './hooks';
import { rewardStyles as s } from './styles';
import { LoyaltyOffer } from './types';

export function CustomerRewardsEntry({
  accountId,
  onEarn,
  onRedeem,
}: {
  accountId: string;
  onEarn?: (businessId: string) => void;
  onRedeem?: (offer: LoyaltyOffer) => void;
}) {
  const rewards = useCustomerRewards(accountId);
  const [qr, setQr] = useState<{ businessId: string; offer: LoyaltyOffer | null } | null>(null);
  if (qr)
    return (
      <SafeAreaView style={s.safe}>
        <CustomerRewardQr
          businessId={qr.businessId}
          offer={qr.offer}
          onBack={() => {
            setQr(null);
            void rewards.refresh();
          }}
        />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.safe}>
      <CustomerRewardsWallet
        {...rewards}
        onJoin={rewards.join}
        onRetry={rewards.refresh}
        onEarn={onEarn ?? ((businessId) => setQr({ businessId, offer: null }))}
        onRedeem={onRedeem ?? ((offer) => setQr({ businessId: offer.businessId, offer }))}
      />
    </SafeAreaView>
  );
}
