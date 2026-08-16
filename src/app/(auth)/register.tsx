import { useRouter } from 'expo-router';

import { AuthEntry } from '../../features/auth/AuthEntry';

export default function RegisterRoute() {
  const router = useRouter();
  return (
    <AuthEntry
      initialMode="register"
      onConfirmation={() => router.replace('/confirm-email')}
      onMode={(mode) => mode === 'login' && router.replace('/sign-in')}
    />
  );
}
