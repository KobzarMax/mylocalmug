import { useRouter } from 'expo-router';

import { useAccount } from '../../../features/auth/AccountProvider';
import { EditProfileScreen } from '../../../features/profile/EditProfileScreen';

export default function EditProfileRoute() {
  const router = useRouter();
  const account = useAccount();
  return (
    <EditProfileScreen
      profile={account.profile!}
      email={account.session?.user.email ?? ''}
      onBack={() => router.back()}
      onSaved={(profile) => {
        account.setProfile(profile);
        router.back();
      }}
    />
  );
}
