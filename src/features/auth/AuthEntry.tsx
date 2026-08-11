import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { palette } from '../../lib/design';
import { useAuthFlow } from './hooks';
import { styles } from './styles';
import { AuthFormScreen } from './components/AuthFormScreen';
import { EmailConfirmationScreen } from './components/EmailConfirmationScreen';

export function AuthEntry() {
  const auth = useAuthFlow();
  if (auth.initializing) return <View style={styles.center}><ActivityIndicator color={palette.green} size="large" /></View>;
  if (auth.pendingEmail) return <EmailConfirmationScreen email={auth.pendingEmail} otp={auth.otp} busy={auth.busy} cooldown={auth.cooldown} error={auth.error} notice={auth.notice} onOtp={auth.setOtp} onVerify={auth.verifyOtp} onResend={auth.resend} onBack={auth.backToLogin} />;
  return <AuthFormScreen mode={auth.mode} displayName={auth.displayName} email={auth.email} password={auth.password} busy={auth.busy} error={auth.error} notice={auth.notice} onMode={auth.setMode} onDisplayName={auth.setDisplayName} onEmail={auth.setEmail} onPassword={auth.setPassword} onSubmit={auth.submit} onVerifyEmail={auth.showConfirmation} />;
}
