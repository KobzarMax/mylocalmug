import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { hasPermission } from '../../business/permissions';
import { Workspace } from '../../business/types';
import { requestRefund } from '../../payments/api';
import { styles } from '../../payments/styles';
import { useBusinessOrders } from '../hooks';
import { createIdempotencyKey } from '../validation';
import { OrderCard } from './OrderCard';

export function BusinessOrderQueue({ workspace, transactions = false }: { workspace: Workspace; transactions?: boolean }) {
  const state = useBusinessOrders(workspace.business.id);
  const [refundBusy, setRefundBusy] = useState<string | null>(null);
  const items = transactions
    ? state.orders.filter((order) => !['unpaid', 'processing'].includes(order.paymentStatus))
    : state.orders.filter((order) => ['needs_confirmation', 'accepted', 'preparing', 'ready'].includes(order.status));
  const canManage = hasPermission(workspace.role, 'orders.manage');
  const canRefund = transactions && hasPermission(workspace.role, 'payments.refund');
  const refund = async (orderId: string, amountPence: number, reason: string) => {
    setRefundBusy(orderId);
    try {
      await requestRefund(orderId, amountPence, reason, createIdempotencyKey('refund'));
      await state.refresh();
      Alert.alert('Refund scheduled', 'Provider confirmation will update the transaction.');
    } catch (error) {
      Alert.alert('Refund failed', error instanceof Error ? error.message : 'Please try again.');
    } finally { setRefundBusy(null); }
  };
  if (state.loading) return <ActivityIndicator color="#235C4B" />;
  return <View style={{ gap: 14 }}>
    {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
    {!items.length ? <View style={styles.empty}><Text style={styles.cardTitle}>{transactions ? 'No transactions yet' : 'No active orders'}</Text><Text style={styles.body}>{transactions ? 'Paid and refunded payments will appear here.' : 'New paid customer orders appear here for confirmation.'}</Text></View>
      : items.map((order) => <OrderCard key={order.id} order={order} busy={state.busyId === order.id || refundBusy === order.id} canManage={canManage && !transactions} onTransition={(status, reason) => void state.transition(order.id, status, reason)} onRefund={canRefund ? (amount, reason) => void refund(order.id, amount, reason) : undefined} />)}
  </View>;
}
