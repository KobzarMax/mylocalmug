import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { hasPermission } from '../business/permissions';
import { Workspace } from '../business/types';
import { LegalEntry } from '../legal/LegalEntry';
import { BusinessOrderQueue } from '../ordering/components/BusinessOrderQueue';
import { TillEntry } from '../till/TillEntry';
import { PaymentHeader } from './components/PaymentHeader';
import { PaymentSetup } from './components/PaymentSetup';
import { usePaymentConnections } from './hooks';
import { styles } from './styles';
import { setupTerminalLocation } from './api';

type Tab = 'setup' | 'till' | 'orders' | 'transactions';

export function PaymentsEntry({ workspace, onBack }: { workspace: Workspace; onBack: () => void }) {
  const canCharge = hasPermission(workspace.role, 'payments.charge');
  const canRead = hasPermission(workspace.role, 'payments.read');
  const tabs: Tab[] = [
    ...(canRead ? ['setup' as const] : []),
    ...(canCharge ? ['till' as const] : []),
    ...(hasPermission(workspace.role, 'orders.read') ? ['orders' as const] : []),
    ...(canRead ? ['transactions' as const] : []),
  ];
  const [tab, setTab] = useState<Tab>(tabs[0] ?? 'orders');
  const [legal, setLegal] = useState(false);
  const state = usePaymentConnections(workspace);
  if (legal) return <LegalEntry workspace={workspace} onBack={() => setLegal(false)} />;
  const run = (promise: Promise<unknown>) => void promise.catch((error) => Alert.alert('Payments', error instanceof Error ? error.message : 'Please try again.'));
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll}>
    <PaymentHeader onBack={onBack} />
    <View style={styles.tabs}>{tabs.map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View>
    {tab === 'setup' ? <PaymentSetup {...state} onLegal={() => setLegal(true)} onStart={(provider) => run(state.start(provider))} onSync={(provider) => void state.sync(provider)} /> : null}
    {tab === 'setup' && state.canConnect && state.connections.some((connection) => connection.provider === 'stripe' && connection.status === 'ready') ? <View style={styles.card}><Text style={styles.cardTitle}>Terminal location</Text><Text style={styles.body}>Create or reuse the Stripe Terminal location mapped to the primary shop location.</Text><Pressable onPress={() => run(setupTerminalLocation(workspace.business.id))} style={styles.button}><Text style={styles.buttonText}>Set up Terminal location</Text></Pressable></View> : null}
    {tab === 'till' ? <TillEntry businessId={workspace.business.id} /> : null}
    {tab === 'orders' ? <BusinessOrderQueue workspace={workspace} /> : null}
    {tab === 'transactions' ? <BusinessOrderQueue workspace={workspace} transactions /> : null}
  </ScrollView></SafeAreaView>;
}
