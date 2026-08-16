import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { palette } from '../../lib/design';

import { AuthFormScreen } from './components/AuthFormScreen';
import { EmailConfirmationScreen } from './components/EmailConfirmationScreen';
import { useAuthFlow } from './hooks';
import { styles } from './styles';

type Props = {
  initialMode?: 'login' | 'register';
  confirmationOnly?: boolean;
  onMode?: (mode: 'login' | 'register') => void;
  onConfirmation?: () => void;
  onBackFromConfirmation?: () => void;
  onMissingConfirmation?: () => void;
};

export function AuthEntry({
  initialMode = 'login',
  confirmationOnly = false,
  onMode,
  onConfirmation,
  onBackFromConfirmation,
  onMissingConfirmation,
}: Props) {
  const auth = useAuthFlow(initialMode);
  useEffect(() => {
    if (auth.pendingEmail && !confirmationOnly) onConfirmation?.();
  }, [auth.pendingEmail, confirmationOnly, onConfirmation]);
  useEffect(() => {
    if (!auth.initializing && confirmationOnly && !auth.pendingEmail) onMissingConfirmation?.();
  }, [auth.initializing, auth.pendingEmail, confirmationOnly, onMissingConfirmation]);
  if (auth.initializing)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.green} size="large" />
      </View>
    );
  if (auth.pendingEmail && (confirmationOnly || !onConfirmation))
    return (
      <EmailConfirmationScreen
        email={auth.pendingEmail}
        otp={auth.otp}
        busy={auth.busy}
        cooldown={auth.cooldown}
        error={auth.error}
        notice={auth.notice}
        onOtp={auth.setOtp}
        onVerify={auth.verifyOtp}
        onResend={auth.resend}
        onBack={() => {
          auth.backToLogin();
          onBackFromConfirmation?.();
        }}
      />
    );
  if (auth.pendingEmail)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.green} size="large" />
      </View>
    );
  if (confirmationOnly)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={palette.green} size="large" />
      </View>
    );
  return (
    <AuthFormScreen
      mode={auth.mode}
      displayName={auth.displayName}
      email={auth.email}
      password={auth.password}
      busy={auth.busy}
      error={auth.error}
      notice={auth.notice}
      onMode={(mode) => {
        auth.setMode(mode);
        onMode?.(mode);
      }}
      onDisplayName={auth.setDisplayName}
      onEmail={auth.setEmail}
      onPassword={auth.setPassword}
      onSubmit={auth.submit}
      onVerifyEmail={auth.showConfirmation}
    />
  );
}
