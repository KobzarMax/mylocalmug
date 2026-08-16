import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { createChallenge } from '../api';
import { LoyaltyOffer, LoyaltyQrChallenge } from '../types';
import { useCountdown } from '../hooks';
import { rewardColors, rewardStyles as s } from '../styles';
import { RewardHeader, RewardLoading } from './RewardUI';

export function CustomerRewardQr({businessId,offer,onBack}:{businessId:string;offer:LoyaltyOffer|null;onBack:()=>void}){const[challenge,setChallenge]=useState<LoyaltyQrChallenge|null>(null);const[error,setError]=useState<string|null>(null);const seconds=useCountdown(challenge?.expiresAt??null);const load=()=>{setChallenge(null);setError(null);createChallenge(businessId,offer?'redeem':'earn',offer?.id??null).then(setChallenge).catch(caught=>setError(caught instanceof Error?caught.message:'Could not create code.'));};useEffect(load,[businessId,offer?.id]);return <ScrollView contentContainerStyle={s.scroll}><RewardHeader title={offer?'Redeem reward':'Earn rewards'} onBack={onBack}/>{!challenge&&!error?<RewardLoading label="Creating one-time code…"/>:error?<View style={s.card}><Text style={s.error}>{error}</Text><Pressable onPress={load} style={s.secondary}><Text style={s.secondaryText}>Try again</Text></Pressable></View>:<View style={s.qrCard}><Text style={s.cardTitle}>{offer?.title??'Staff-verified purchase'}</Text><Text style={s.meta}>{offer?'Ask staff to scan, verify the qualifying basket, and apply the benefit.':'Ask staff to scan this after checking your purchase.'}</Text><View style={{padding:24}}><QRCode value={challenge!.challengeToken} size={220} color={rewardColors.ink} backgroundColor={rewardColors.paper}/></View><Text style={[s.cardTitle,seconds===0&&s.warningText]}>{seconds>0?`${seconds}s remaining`:'Code expired'}</Text><Text style={s.meta}>Single use · bound to this shop and purpose · contains no account or balance data</Text>{seconds===0&&<Pressable onPress={load} style={s.primary}><Text style={s.primaryText}>Create a new code</Text></Pressable>}</View>}</ScrollView>}

