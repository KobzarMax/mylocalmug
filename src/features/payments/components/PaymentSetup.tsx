import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { styles } from '../styles';
import { PaymentConnection, PaymentProvider } from '../types';

export function PaymentSetup({
  connections,
  loading,
  busy,
  error,
  canConnect,
  onLegal,
  onStart,
  onSync,
}: {
  connections: PaymentConnection[];
  loading: boolean;
  busy: PaymentProvider | null;
  error: string | null;
  canConnect: boolean;
  onLegal: () => void;
  onStart: (provider: PaymentProvider) => void;
  onSync: (provider: PaymentProvider) => void;
}) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>UK legal information</Text>
        <Text style={styles.body}>
          An approved legal profile is required before merchant onboarding. Stripe and PayPal collect bank,
          representative, owner, and identity details securely.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onLegal}
          style={[styles.button, styles.buttonSecondary]}
        >
          <Text style={styles.buttonSecondaryText}>Review legal profile</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color="#235C4B" />
      ) : (
        (['stripe', 'paypal'] as PaymentProvider[]).map((provider) => (
          <ProviderCard
            key={provider}
            provider={provider}
            connection={connections.find((item) => item.provider === provider)}
            busy={busy === provider}
            canConnect={canConnect}
            onStart={() => onStart(provider)}
            onSync={() => onSync(provider)}
          />
        ))
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}
function ProviderCard({
  provider,
  connection,
  busy,
  canConnect,
  onStart,
  onSync,
}: {
  provider: PaymentProvider;
  connection?: PaymentConnection;
  busy: boolean;
  canConnect: boolean;
  onStart: () => void;
  onSync: () => void;
}) {
  const title = provider === 'stripe' ? 'Stripe cards & Terminal' : 'PayPal checkout';
  const status = connection?.status ?? 'not_started';
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.status}>{status.replace('_', ' ')}</Text>
      </View>
      <Text style={styles.body}>
        {provider === 'stripe'
          ? 'Required for card, Apple Pay, Google Pay, and in-person reader payments.'
          : 'Optional. Available to customers only after PayPal confirms seller eligibility.'}
      </Text>
      {canConnect ? (
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onStart}
            style={[styles.button, { flex: 1 }, busy && styles.disabled]}
          >
            <Text style={styles.buttonText}>
              {status === 'not_started'
                ? 'Connect'
                : status === 'ready'
                  ? 'Open setup'
                  : 'Continue onboarding'}
            </Text>
          </Pressable>
          {connection ? (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onSync}
              style={[styles.button, styles.buttonSecondary, busy && styles.disabled]}
            >
              <Text style={styles.buttonSecondaryText}>Refresh</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text style={styles.body}>Only an owner or admin can change provider connections.</Text>
      )}
    </View>
  );
}
