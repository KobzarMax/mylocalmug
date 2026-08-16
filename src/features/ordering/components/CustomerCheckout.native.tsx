import { initPaymentSheet, initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

import { useNetworkStatus } from '../../../lib/query/QueryProvider';
import { createPayPalPayment, createStripePayment, getAvailablePaymentMethods } from '../../payments/api';
import { styles } from '../../payments/styles';
import { createOrder, getOrder } from '../api';
import { BasketLine, Order } from '../types';
import { createIdempotencyKey, formatGbp } from '../validation';

export function CustomerCheckout({
  businessId,
  businessName,
  location,
  basket,
  onBack,
  onComplete,
}: {
  businessId: string;
  businessName: string;
  location: string;
  basket: BasketLine[];
  onBack: () => void;
  onComplete: () => void;
}) {
  const { isOnline } = useNetworkStatus();
  const [methods, setMethods] = useState({ stripe: false, paypal: false });
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = useMemo(
    () => basket.reduce((sum, line) => sum + line.unitPricePence * line.quantity, 0),
    [basket],
  );
  useEffect(() => {
    if (isOnline)
      void getAvailablePaymentMethods(businessId)
        .then(setMethods)
        .catch(() => setError('Payment methods are unavailable.'));
  }, [businessId, isOnline]);
  const ensureOrder = async () =>
    order ??
    createOrder(
      businessId,
      'customer',
      basket.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
      createIdempotencyKey('customer-order'),
    ).then((next) => (setOrder(next), next));
  const card = async () =>
    run(async () => {
      const current = await ensureOrder();
      const setup = await createStripePayment(current.id, 'card', `stripe-payment:${current.id}`);
      await initStripe({
        publishableKey: setup.publishableKey,
        stripeAccountId: setup.connectedAccountId,
        merchantIdentifier: process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID ?? 'merchant.com.kobzarmax.localmug',
        urlScheme: 'localmug',
      });
      const initialized = await initPaymentSheet({
        merchantDisplayName: businessName,
        paymentIntentClientSecret: setup.clientSecret,
        applePay: { merchantCountryCode: 'GB' },
        googlePay: {
          merchantCountryCode: 'GB',
          testEnv: process.env.EXPO_PUBLIC_GOOGLE_PAY_TEST !== 'false',
        },
        returnURL: 'localmug://payments/return',
      });
      if (initialized.error) throw new Error(initialized.error.message);
      const presented = await presentPaymentSheet();
      if (presented.error) throw new Error(presented.error.message);
      await poll(current.id);
    });
  const paypal = async () =>
    run(async () => {
      const current = await ensureOrder();
      const setup = await createPayPalPayment(current.id, `paypal-payment:${current.id}`);
      if (!setup.approvalUrl) throw new Error('PayPal approval URL is missing.');
      await WebBrowser.openBrowserAsync(setup.approvalUrl);
      await poll(current.id);
    });
  const poll = async (id: string) => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const latest = await getOrder(id);
      setOrder(latest);
      if (latest.paymentStatus === 'paid' || latest.status !== 'awaiting_payment') return;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    throw new Error('Payment is still processing. Your order will refresh without charging again.');
  };
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed.');
    } finally {
      setBusy(false);
    }
  };
  if (order && order.status !== 'awaiting_payment')
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.scroll, { flex: 1 }]}>
          <Text style={styles.overline}>Order {order.id.slice(0, 8)}</Text>
          <Text style={styles.title}>{order.status.replace('_', ' ')}</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{statusTitle(order)}</Text>
            <Text style={styles.body}>
              {order.confirmationDeadline
                ? `The shop has until ${new Date(order.confirmationDeadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} to confirm.`
                : 'This screen updates as the shop prepares your order.'}
            </Text>
            {order.cancellationReason ? <Text style={styles.error}>{order.cancellationReason}</Text> : null}
          </View>
          <Pressable accessibilityRole="button" onPress={onComplete} style={styles.button}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
          <Text>←</Text>
        </Pressable>
        <Text style={styles.overline}>ASAP pickup</Text>
        <Text style={styles.title}>Review order</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{businessName}</Text>
          <Text style={styles.body}>{location}</Text>
          {basket.map((line) => (
            <View key={line.menuItemId} style={styles.row}>
              <Text style={styles.item}>
                {line.quantity} × {line.name}
              </Text>
              <Text>{formatGbp(line.unitPricePence * line.quantity)}</Text>
            </View>
          ))}
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Total</Text>
            <Text style={styles.amount}>{formatGbp(total)}</Text>
          </View>
          <Text style={styles.body}>
            Prices are tax-inclusive customer totals. This is a receipt, not a VAT invoice.
          </Text>
        </View>
        {!isOnline ? <Text style={styles.error}>Connect to the internet to place an order.</Text> : null}
        {methods.stripe ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy || !isOnline}
            onPress={card}
            style={[styles.button, (busy || !isOnline) && styles.disabled]}
          >
            <Text style={styles.buttonText}>Pay by card, Apple Pay or Google Pay</Text>
          </Pressable>
        ) : null}
        {methods.paypal ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy || !isOnline}
            onPress={paypal}
            style={[styles.button, styles.buttonSecondary, (busy || !isOnline) && styles.disabled]}
          >
            <Text style={styles.buttonSecondaryText}>Pay with PayPal</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
function statusTitle(order: Order) {
  if (order.status === 'needs_confirmation') return 'Payment received · waiting for shop';
  if (order.status === 'refund_pending') return 'Refund is being processed';
  if (order.status === 'refunded') return 'Payment refunded';
  return `Order ${order.status.replace('_', ' ')}`;
}
