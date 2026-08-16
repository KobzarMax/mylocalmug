import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

import { safeErrorMessage } from '../../../lib/errors';
import { claimChallenge, confirmEarning, consumeRedemption } from '../api';
import { rewardStyles as s } from '../styles';
import { ClaimedChallenge, MenuChoice } from '../types';

import { RewardHeader } from './RewardUI';

export function LoyaltyScanner({ menu, onBack }: { menu: MenuChoice[]; onBack: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [token, setToken] = useState('');
  const [claimed, setClaimed] = useState<ClaimedChallenge | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [freeItems, setFreeItems] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; message: string } | null>(null);
  const requestKey = useRef(`loyalty-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const claim = async (value: string) => {
    if (scanning || claimed) return;
    setScanning(true);
    setError(null);
    try {
      setClaimed(await claimChallenge(value));
    } catch (caught) {
      setError(safeErrorMessage(caught, 'This code is invalid, expired, or already used.'));
    } finally {
      setScanning(false);
    }
  };
  if (!claimed)
    return (
      <SafeAreaView style={s.safe}>
        <RewardHeader title="Scan rewards code" onBack={onBack} />
        {permission?.granted ? (
          <View style={{ flex: 1 }}>
            <CameraView
              style={s.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => void claim(data)}
            />
            <View style={s.scannerOverlay}>
              <Text style={s.cardTitle}>One-time customer code</Text>
              <Text style={s.meta}>Only a live, unused 60-second code can be claimed.</Text>
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll}>
            <Text style={s.intro}>Camera access is used only to scan customer reward codes.</Text>
            <Pressable accessibilityRole="button" onPress={requestPermission} style={s.primary}>
              <Text style={s.primaryText}>Allow camera</Text>
            </Pressable>
            <Text style={s.sectionTitle}>Manual fallback</Text>
            <TextInput
              accessibilityLabel="One-time rewards code"
              autoCapitalize="none"
              value={token}
              onChangeText={setToken}
              style={s.field}
              placeholder="Paste one-time code"
            />
            <Pressable
              accessibilityRole="button"
              disabled={!token.trim() || scanning}
              onPress={() => void claim(token)}
              style={[s.secondary, (!token.trim() || scanning) && s.disabled]}
            >
              <Text style={s.secondaryText}>Validate code</Text>
            </Pressable>
            {error ? (
              <Text accessibilityLiveRegion="assertive" style={s.warningText}>
                {error}
              </Text>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  if (result)
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          <RewardHeader title="Rewards receipt" onBack={onBack} />
          <View accessibilityLiveRegion="polite" style={s.card}>
            <Text style={s.cardTitle}>{result.title}</Text>
            <Text style={s.meta}>{result.message}</Text>
            <Text style={s.meta}>This result is immutable and linked to the claimed one-time code.</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onBack} style={s.primary}>
            <Text style={s.primaryText}>Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  const items = menu
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      menuItemId: item.id,
      quantity: quantities[item.id],
      wasFree: Boolean(freeItems[item.id]),
    }));
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      if (claimed.purpose === 'earn') {
        const receipt = await confirmEarning(
          claimed.challengeId,
          { items, finalEligiblePence: Math.round(Number(amount || 0) * 100) },
          requestKey.current,
        );
        setResult({
          title: 'Progress issued',
          message: receipt.entries.length
            ? receipt.entries.map((entry) => `+${entry.amount} ${entry.programName}`).join('\n')
            : 'No joined programme matched this purchase.',
        });
      } else {
        await consumeRedemption(claimed.challengeId, items, requestKey.current);
        setResult({
          title: 'Reward validated',
          message: 'Apply the displayed benefit on the external till.',
        });
      }
    } catch (caught) {
      setError(safeErrorMessage(caught, 'Could not confirm this transaction. Check the code and try again.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <RewardHeader
          title={claimed.purpose === 'earn' ? 'Verify purchase' : 'Validate redemption'}
          onBack={onBack}
        />
        <View style={s.card}>
          <Text style={s.cardTitle}>{claimed.customerName}</Text>
          <Text style={s.meta}>
            The one-time code is claimed by your staff session. Confirm only after checking the external-till
            purchase.
          </Text>
          <Text style={s.meta}>Claim expires {new Date(claimed.expiresAt).toLocaleTimeString()}.</Text>
        </View>
        {claimed.purpose === 'earn' && (
          <>
            <Text style={s.label}>Final eligible spend (£)</Text>
            <TextInput
              accessibilityLabel="Final eligible spend in pounds"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={s.field}
            />
          </>
        )}
        <Text style={s.sectionTitle}>Qualifying basket</Text>
        {menu.map((item) => (
          <View key={item.id} style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <Text style={s.meta}>{item.categoryName}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}
                onPress={() =>
                  setQuantities((all) => ({ ...all, [item.id]: Math.max(0, (all[item.id] ?? 0) - 1) }))
                }
                style={s.iconButton}
              >
                <Text>−</Text>
              </Pressable>
              <Text style={s.quantity}>{quantities[item.id] ?? 0}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name}`}
                onPress={() =>
                  setQuantities((all) => ({ ...all, [item.id]: Math.min(99, (all[item.id] ?? 0) + 1) }))
                }
                style={s.iconButton}
              >
                <Text>+</Text>
              </Pressable>
            </View>
            {claimed.purpose === 'earn' && (quantities[item.id] ?? 0) > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setFreeItems((all) => ({ ...all, [item.id]: !all[item.id] }))}
                style={s.secondary}
              >
                <Text style={s.secondaryText}>
                  {freeItems[item.id] ? 'Free/redeemed · earns no item points' : 'Mark free or redeemed'}
                </Text>
              </Pressable>
            )}
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={confirm}
          style={[s.primary, busy && s.disabled]}
        >
          <Text style={s.primaryText}>
            {busy
              ? 'Confirming…'
              : claimed.purpose === 'earn'
                ? 'Issue verified progress'
                : 'Consume reward once'}
          </Text>
        </Pressable>
        {error ? (
          <Text accessibilityLiveRegion="assertive" style={s.warningText}>
            {error}
          </Text>
        ) : null}
        <Text style={s.meta}>
          This creates an immutable audit record. It does not independently verify payment processed by the
          external till.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
