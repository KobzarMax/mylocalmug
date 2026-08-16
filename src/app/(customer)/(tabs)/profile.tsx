import { useRouter } from 'expo-router';

import { useAccount } from '../../../features/auth/AccountProvider';
import { ProfileScreen } from '../../../features/profile/ProfileScreen';

export default function ProfileRoute() {
  const router = useRouter();
  const account = useAccount();
  const profile = account.profile!;
  return (
    <ProfileScreen
      displayName={profile.display_name}
      email={account.session?.user.email ?? ''}
      description={profile.description}
      avatarPath={profile.avatar_path}
      onEdit={() => router.push('/profile/edit')}
      onBusiness={() => router.push('/business')}
      onSignOut={() => void account.signOut()}
    />
  );
}
