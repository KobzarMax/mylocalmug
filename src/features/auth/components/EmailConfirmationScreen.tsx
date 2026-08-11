import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../../../lib/design';
import { authGradient, styles } from '../styles';
import { AuthBrand } from './AuthBrand';

type Props = {
  email: string;
  otp: string;
  busy: boolean;
  cooldown: number;
  error: string | null;
  notice: string | null;
  onOtp: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
};

export function EmailConfirmationScreen(props: Props) {
  const resendDisabled = props.busy || props.cooldown > 0;
  return <LinearGradient colors={authGradient} style={styles.background}>
    <StatusBar barStyle="dark-content" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AuthBrand />
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We sent a confirmation message to:</Text>
        <Text style={styles.email}>{props.email}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Confirmation code</Text>
          <TextInput value={props.otp} onChangeText={props.onOtp} editable={!props.busy} maxLength={8} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" placeholder="000000" placeholderTextColor="#9B918A" style={[styles.input, styles.otpInput]} />
          <Text style={styles.hint}>Enter the newest numeric code from the email. If your template also includes a confirmation link, the app can process that too.</Text>
          {props.error && <Text accessibilityLiveRegion="polite" style={styles.error}>{props.error}</Text>}
          {props.notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{props.notice}</Text>}
          <Pressable disabled={props.busy} onPress={props.onVerify} style={[styles.primary, props.busy && styles.disabled]}>{props.busy ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.primaryText}>Verify email</Text>}</Pressable>
          <Pressable disabled={resendDisabled} onPress={props.onResend} style={[styles.secondary, resendDisabled && styles.disabled]}><Text style={styles.secondaryText}>{props.cooldown > 0 ? `Resend available in ${props.cooldown}s` : 'Resend confirmation email'}</Text></Pressable>
          <Pressable disabled={props.busy} onPress={props.onBack} style={styles.textButton}><Text style={styles.textButtonText}>Back to sign in</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </LinearGradient>;
}
