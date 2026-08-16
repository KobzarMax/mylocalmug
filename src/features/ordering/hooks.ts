import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

import { listBusinessOrders, listCustomerOrders, updateOrderStatus } from './api';
import { Order, OrderStatus } from './types';

export function useBusinessOrders(businessId: string) {
  const loader = useCallback(() => listBusinessOrders(businessId), [businessId]);
  return useOrders(loader, businessId, 'business_id');
}
export function useCustomerOrders(customerId: string) {
  const loader = useCallback(() => listCustomerOrders(customerId), [customerId]);
  return useOrders(loader, customerId, 'customer_id');
}
function useOrders(
  loader: () => Promise<Order[]>,
  channelKey: string,
  filterColumn: 'business_id' | 'customer_id',
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setError(null);
    try {
      setOrders(await loader());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Orders are unavailable.');
    } finally {
      setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel(`orders:${channelKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `${filterColumn}=eq.${channelKey}` },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelKey, filterColumn, refresh]);
  const transition = async (orderId: string, status: OrderStatus, reason?: string) => {
    setBusyId(orderId);
    try {
      await updateOrderStatus(orderId, status, reason);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };
  return { orders, loading, busyId, error, refresh, transition };
}
