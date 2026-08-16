import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useCustomerRewards } from './hooks';
import { LoyaltyOffer } from './types';
import { rewardStyles as s } from './styles';
import { CustomerRewardsWallet } from './components/CustomerRewardsWallet';
import { CustomerRewardQr } from './components/CustomerRewardQr';

export function CustomerRewardsEntry({accountId}:{accountId:string}){const rewards=useCustomerRewards(accountId);const[qr,setQr]=useState<{businessId:string;offer:LoyaltyOffer|null}|null>(null);if(qr)return <SafeAreaView style={s.safe}><CustomerRewardQr businessId={qr.businessId} offer={qr.offer} onBack={()=>{setQr(null);void rewards.refresh();}}/></SafeAreaView>;return <SafeAreaView style={s.safe}><CustomerRewardsWallet {...rewards} onJoin={rewards.join} onRetry={rewards.refresh} onEarn={businessId=>setQr({businessId,offer:null})} onRedeem={offer=>setQr({businessId:offer.businessId,offer})}/></SafeAreaView>}
