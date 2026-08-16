import { useRouter } from 'expo-router';

import { AuthEntry } from '../../features/auth/AuthEntry';

export default function ConfirmEmailRoute() {
  const router = useRouter();
  return (
    <AuthEntry
      confirmationOnly
      onBackFromConfirmation={() => router.replace('/sign-in')}
      onMissingConfirmation={() => router.replace('/sign-in')}
    />
  );
}
