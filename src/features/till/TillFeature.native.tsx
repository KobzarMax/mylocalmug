import { isRunningInExpoGo } from 'expo';
import React, { Component, lazy, Suspense } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { styles } from '../payments/styles';

import { TillUnavailable } from './components/TillUnavailable';

type Props = { businessId: string };
const NativeTillEntry = lazy(async () => {
  const module = await import('./TillEntry');
  return { default: module.TillEntry };
});

class TillErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('Stripe Terminal could not be loaded in this native build.', error);
  }
  render() {
    return this.state.failed ? <TillUnavailable reason="native-module" /> : this.props.children;
  }
}

export function TillFeature({ businessId }: Props) {
  if (isRunningInExpoGo()) return <TillUnavailable reason="expo-go" />;
  return (
    <TillErrorBoundary>
      <Suspense
        fallback={
          <View accessibilityRole="progressbar" style={styles.card}>
            <ActivityIndicator />
            <Text style={styles.body}>Loading card reader…</Text>
          </View>
        }
      >
        <NativeTillEntry businessId={businessId} />
      </Suspense>
    </TillErrorBoundary>
  );
}
