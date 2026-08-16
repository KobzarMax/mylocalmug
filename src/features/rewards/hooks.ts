import { useCallback, useEffect, useState } from 'react';
import { getBusinessRewards, getCustomerRewards, getRewardMenu, joinProgram, saveOffer, saveProgram, setProgramStatus } from './api';
import { LoyaltyOffer, LoyaltyOfferInput, LoyaltyProgram, LoyaltyProgramInput, LoyaltyProgramStatus, LoyaltyStats, MenuChoice } from './types';

export function useBusinessRewards(businessId:string){
  const[programs,setPrograms]=useState<LoyaltyProgram[]>([]);const[offers,setOffers]=useState<LoyaltyOffer[]>([]);const[menu,setMenu]=useState<MenuChoice[]>([]);const[stats,setStats]=useState<LoyaltyStats>({memberships:0,issuances:0,redemptions:0,reversals:0});const[loading,setLoading]=useState(true);const[busy,setBusy]=useState(false);const[error,setError]=useState<string|null>(null);
  const refresh=useCallback(async()=>{setLoading(true);setError(null);try{const[data,menuData]=await Promise.all([getBusinessRewards(businessId),getRewardMenu(businessId)]);setPrograms(data.programs);setOffers(data.offers);setStats(data.stats);setMenu(menuData);}catch(caught){setError(message(caught));}finally{setLoading(false);}},[businessId]);
  useEffect(()=>{void refresh();},[refresh]);
  const run=useCallback(async<T,>(operation:()=>Promise<T>)=>{setBusy(true);try{const result=await operation();await refresh();return result;}finally{setBusy(false);}},[refresh]);
  return{programs,offers,menu,stats,loading,busy,error,refresh,saveProgram:(id:string|null,input:LoyaltyProgramInput)=>run(()=>saveProgram(businessId,id,input)),saveOffer:(id:string|null,input:LoyaltyOfferInput)=>run(()=>saveOffer(businessId,id,input)),setStatus:(id:string,status:LoyaltyProgramStatus)=>run(()=>setProgramStatus(id,status))};
}

export function useCustomerRewards(customerId:string){
  const[programs,setPrograms]=useState<LoyaltyProgram[]>([]);const[accounts,setAccounts]=useState<Awaited<ReturnType<typeof getCustomerRewards>>['accounts']>([]);const[offers,setOffers]=useState<LoyaltyOffer[]>([]);const[ledger,setLedger]=useState<Awaited<ReturnType<typeof getCustomerRewards>>['ledger']>([]);const[unlockedTierIds,setUnlockedTierIds]=useState<string[]>([]);const[loading,setLoading]=useState(true);const[busy,setBusy]=useState(false);const[error,setError]=useState<string|null>(null);
  const refresh=useCallback(async()=>{setLoading(true);setError(null);try{const data=await getCustomerRewards(customerId);setPrograms(data.programs);setAccounts(data.accounts);setOffers(data.offers);setLedger(data.ledger);setUnlockedTierIds(data.unlockedTierIds);}catch(caught){setError(message(caught));}finally{setLoading(false);}},[customerId]);
  useEffect(()=>{void refresh();},[refresh]);
  const join=async(programId:string)=>{setBusy(true);try{await joinProgram(programId);await refresh();}finally{setBusy(false);}};
  return{programs,accounts,offers,ledger,unlockedTierIds,loading,busy,error,refresh,join};
}

export function useCountdown(expiresAt:string|null){const[seconds,setSeconds]=useState(0);useEffect(()=>{const update=()=>setSeconds(Math.max(0,Math.ceil((new Date(expiresAt??0).getTime()-Date.now())/1000)));update();const timer=setInterval(update,250);return()=>clearInterval(timer);},[expiresAt]);return seconds;}
export function message(caught:unknown){return caught instanceof Error?caught.message:'Please try again.';}
