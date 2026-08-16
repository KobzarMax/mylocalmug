import { useRouter } from 'expo-router';

import { useAccount } from '../../../features/auth/AccountProvider';
import { CustomerContentEntry } from '../../../features/content/CustomerContentEntry';

export default function NewsRoute() {
  const router = useRouter();
  const { session } = useAccount();
  return (
    <CustomerContentEntry
      accountId={session!.user.id}
      onOpenContent={(contentId) => router.push({ pathname: '/content/[contentId]', params: { contentId } })}
    />
  );
}
