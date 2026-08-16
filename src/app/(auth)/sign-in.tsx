import { useRouter } from 'expo-router';

import { AuthEntry } from '../../features/auth/AuthEntry';

export default function SignInRoute() {
  const router = useRouter();
  return (
    <AuthEntry
      onConfirmation={() => router.replace('/confirm-email')}
      onMode={(mode) => mode === 'register' && router.replace('/register')}
    />
  );
}
