import React, { Component, lazy, Suspense } from 'react';
import { isRunningInExpoGo } from 'expo';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from '../payments/styles';
import { TillUnavailable } from './components/TillUnavailable';

type TillFeatureProps = {
  businessId: string;
};

type TillErrorBoundaryProps = {
  children: React.ReactNode;
};

type TillErrorBoundaryState = {
  failed: boolean;
};

const NativeTillEntry = lazy(async () => {
  const module = await import('./TillEntry');
  return { default: module.TillEntry };
});

class TillErrorBoundary extends Component<TillErrorBoundaryProps, TillErrorBoundaryState> {
  state: TillErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): TillErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Stripe Terminal could not be loaded in this native build.', error);
  }

  render() {
    if (this.state.failed) {
      return <TillUnavailable reason="native-module" />;
    }

    return this.props.children;
  }
}

function TillLoading() {
  return (
    <View accessibilityRole="progressbar" style={styles.card}>
      <ActivityIndicator />
      <Text style={styles.body}>Loading card reader…</Text>
    </View>
  );
}

export function TillFeature({ businessId }: TillFeatureProps) {
  if (isRunningInExpoGo()) {
    return <TillUnavailable reason="expo-go" />;
  }

  return (
    <TillErrorBoundary>
      <Suspense fallback={<TillLoading />}>
        <NativeTillEntry businessId={businessId} />
      </Suspense>
    </TillErrorBoundary>
  );
}
