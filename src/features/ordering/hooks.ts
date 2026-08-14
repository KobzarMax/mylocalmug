import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { listBusinessOrders, listCustomerOrders, updateOrderStatus } from './api';
import { Order, OrderStatus } from './types';

export function useBusinessOrders(businessId:string){return useOrders(()=>listBusinessOrders(businessId),businessId);}
export function useCustomerOrders(customerId:string){return useOrders(()=>listCustomerOrders(customerId),customerId);}
function useOrders(loader:()=>Promise<Order[]>,channelKey:string){const[orders,setOrders]=useState<Order[]>([]);const[loading,setLoading]=useState(true);const[busyId,setBusyId]=useState<string|null>(null);const[error,setError]=useState<string|null>(null);const refresh=useCallback(async()=>{setError(null);try{setOrders(await loader());}catch(e){setError(e instanceof Error?e.message:'Orders are unavailable.');}finally{setLoading(false);}},[channelKey]);useEffect(()=>{void refresh();const channel=supabase.channel(`orders:${channelKey}`).on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>void refresh()).subscribe();return()=>{void supabase.removeChannel(channel);};},[channelKey,refresh]);const transition=async(orderId:string,status:OrderStatus,reason?:string)=>{setBusyId(orderId);try{await updateOrderStatus(orderId,status,reason);await refresh();}finally{setBusyId(null);}};return{orders,loading,busyId,error,refresh,transition};}
