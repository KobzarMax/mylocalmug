import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { palette } from '../../../lib/design';
import { authGradient, styles } from '../styles';
import { AuthMode } from '../types';

import { AuthBrand } from './AuthBrand';

type Props = {
  mode: AuthMode;
  displayName: string;
  email: string;
  password: string;
  busy: boolean;
  error: string | null;
  notice: string | null;
  onMode: (mode: AuthMode) => void;
  onDisplayName: (value: string) => void;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: () => void;
  onVerifyEmail: () => void;
};

export function AuthFormScreen(props: Props) {
  const registering = props.mode === 'register';
  return (
    <LinearGradient colors={authGradient} style={styles.background}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AuthBrand />
          <Text style={styles.title}>{registering ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {registering
              ? 'Create one personal account, then apply for or join a business.'
              : 'Sign in to your Local Mug account.'}
          </Text>
          <View style={styles.card}>
            <View style={styles.tabs}>
              <AuthTab label="Log in" active={!registering} onPress={() => props.onMode('login')} />
              <AuthTab label="Register" active={registering} onPress={() => props.onMode('register')} />
            </View>
            {registering && (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  accessibilityLabel="Name"
                  value={props.displayName}
                  onChangeText={props.onDisplayName}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  placeholderTextColor={palette.placeholder}
                  style={styles.input}
                />
              </>
            )}
            <Text style={styles.label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              value={props.email}
              onChangeText={props.onEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={palette.placeholder}
              style={styles.input}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              value={props.password}
              onChangeText={props.onPassword}
              secureTextEntry
              autoComplete={registering ? 'new-password' : 'current-password'}
              placeholder="Minimum 8 characters"
              placeholderTextColor={palette.placeholder}
              style={styles.input}
            />
            {props.error && (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {props.error}
              </Text>
            )}
            {props.notice && (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                {props.notice}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={props.busy}
              onPress={props.onSubmit}
              style={[styles.primary, props.busy && styles.disabled]}
            >
              {props.busy ? (
                <ActivityIndicator color={palette.paper} />
              ) : (
                <>
                  <Ionicons
                    name={registering ? 'person-add-outline' : 'log-in-outline'}
                    size={18}
                    color={palette.paper}
                  />
                  <Text style={styles.primaryText}>{registering ? 'Create account' : 'Log in'}</Text>
                </>
              )}
            </Pressable>
            {!registering && (
              <Pressable
                accessibilityRole="button"
                disabled={props.busy}
                onPress={props.onVerifyEmail}
                style={styles.textButton}
              >
                <Text style={styles.textButtonText}>I still need to verify my email</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function AuthTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}
