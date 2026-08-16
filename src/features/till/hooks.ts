import { requestNeededAndroidPermissions, useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { getBusinessMenu } from '../menu/api';
import { MenuItem } from '../menu/types';
import { createOrder, getOrder } from '../ordering/api';
import { BasketLine } from '../ordering/types';
import { createIdempotencyKey } from '../ordering/validation';
import { createTerminalPayment, syncTerminalReaders } from '../payments/api';

import { listTerminalLocations } from './api';
import { TerminalLocation } from './types';

export function useTill(businessId: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [location, setLocation] = useState<TerminalLocation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Connect a reader to begin.');
  const terminal = useStripeTerminal();
  useEffect(() => {
    void Promise.all([getBusinessMenu(businessId), listTerminalLocations(businessId)])
      .then(([menu, locations]) => {
        setItems(menu.items.filter((item) => item.isAvailable));
        setLocation(locations[0] ?? null);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Till setup is unavailable.'));
  }, [businessId]);
  const add = (item: MenuItem) => {
    setPendingOrderId(null);
    setBasket((current) => {
      const found = current.find((line) => line.menuItemId === item.id);
      return found
        ? current.map((line) =>
            line.menuItemId === item.id ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line,
          )
        : [
            ...current,
            {
              menuItemId: item.id,
              name: item.name,
              unitPricePence: Math.round(item.price * 100),
              quantity: 1,
            },
          ];
    });
  };
  const remove = (id: string) => {
    setPendingOrderId(null);
    setBasket((current) =>
      current.flatMap((line) =>
        line.menuItemId === id
          ? line.quantity > 1
            ? [{ ...line, quantity: line.quantity - 1 }]
            : []
          : [line],
      ),
    );
  };
  const discover = async (simulated: boolean) => {
    if (!location) throw new Error('An owner or admin must set up the Terminal location first.');
    setBusy(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await requestNeededAndroidPermissions({
          accessFineLocation: {
            title: 'Location permission',
            message: 'Local Mug needs location access to connect the payment reader.',
            buttonPositive: 'Allow',
          },
        });
        if (!granted) throw new Error('Location and Bluetooth permissions are required.');
      }
      const result = await terminal.discoverReaders({ discoveryMethod: 'bluetoothScan', simulated });
      if (result.error) throw new Error(result.error.message);
      setMessage(terminal.discoveredReaders.length ? 'Choose a reader.' : 'Searching for readers…');
    } finally {
      setBusy(false);
    }
  };
  const connect = async (index: number) => {
    if (!location) throw new Error('Terminal location is missing.');
    const reader = terminal.discoveredReaders[index];
    if (!reader) throw new Error('Reader is no longer available.');
    setBusy(true);
    try {
      const result = await terminal.connectReader({
        discoveryMethod: 'bluetoothScan',
        reader,
        locationId: location.providerLocationId,
        autoReconnectOnUnexpectedDisconnect: true,
      });
      if (result.error) throw new Error(result.error.message);
      await syncTerminalReaders(businessId).catch(() => undefined);
      setMessage(`Connected to ${reader.label ?? reader.serialNumber}.`);
    } finally {
      setBusy(false);
    }
  };
  const charge = async () => {
    if (!basket.length) throw new Error('Add an item first.');
    if (!terminal.connectedReader) throw new Error('Connect a reader first.');
    setBusy(true);
    try {
      const order = pendingOrderId
        ? await getOrder(pendingOrderId)
        : await createOrder(
            businessId,
            'till',
            basket.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })),
            createIdempotencyKey('till-order'),
          );
      setPendingOrderId(order.id);
      const setup = await createTerminalPayment(order.id, `terminal-payment:${order.id}`);
      const retrieved = await terminal.retrievePaymentIntent(setup.clientSecret);
      if (retrieved.error) throw new Error(retrieved.error.message);
      const collected = await terminal.collectPaymentMethod({
        paymentIntent: retrieved.paymentIntent,
        skipTipping: true,
      });
      if (collected.error) throw new Error(collected.error.message);
      const processed = await terminal.processPaymentIntent({
        paymentIntent: collected.paymentIntent,
        skipTipping: true,
      });
      if (processed.error) throw new Error(processed.error.message);
      setPendingOrderId(null);
      setBasket([]);
      setMessage(
        `Payment ${processed.paymentIntent.status === 'succeeded' ? 'approved' : 'submitted for confirmation'}. Order ${order.id.slice(0, 8)}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Payment failed. Check the order before retrying.');
      throw error;
    } finally {
      setBusy(false);
    }
  };
  const totalPence = useMemo(
    () => basket.reduce((total, line) => total + line.unitPricePence * line.quantity, 0),
    [basket],
  );
  return {
    items,
    basket,
    totalPence,
    location,
    busy,
    message,
    readers: terminal.discoveredReaders,
    connectedReader: terminal.connectedReader,
    add,
    remove,
    discover,
    connect,
    charge,
  };
}
