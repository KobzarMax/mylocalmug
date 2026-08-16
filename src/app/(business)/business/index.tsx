import { Redirect, useRouter } from 'expo-router';

import { useAccount } from '../../../features/auth/AccountProvider';
import { useBusinessWorkspace } from '../../../features/business/BusinessWorkspaceProvider';
import { ApplicationStatusScreen } from '../../../features/business/components/ApplicationStatusScreen';
import { BusinessApplicationForm } from '../../../features/business/components/BusinessApplicationForm';
import { BusinessDashboard } from '../../../features/business/components/BusinessDashboard';
import { PortalError, PortalLoading } from '../../../features/business/components/BusinessUI';
import { useBusinessSetup } from '../../../features/business/dashboardHooks';
import { createEmptyApplication } from '../../../features/business/types';
import { InvitationAcceptanceGate } from '../../../features/team/InvitationAcceptanceGate';

export default function BusinessHomeRoute() {
  const router = useRouter();
  const account = useAccount();
  const access = useBusinessWorkspace();
  const session = account.session!;
  if (access.loading) return <PortalLoading />;
  if (access.error)
    return <PortalError message={access.error} onRetry={access.refresh} onBack={() => router.back()} />;
  if (access.workspace) {
    return <BusinessWorkspaceHome />;
  }
  if (access.isPlatformAdmin) return <Redirect href="/business/applications" />;
  const initial = access.application ?? {
    ...createEmptyApplication(session.user.email ?? ''),
    id: '',
    status: 'draft' as const,
    rejectionReason: null,
  };
  const screen =
    access.application && ['submitted', 'under_review', 'approved'].includes(access.application.status) ? (
      <ApplicationStatusScreen
        application={access.application}
        onBack={() => router.back()}
        onRefresh={access.refresh}
      />
    ) : (
      <BusinessApplicationForm
        userId={session.user.id}
        initial={initial}
        onBack={() => router.back()}
        onChanged={access.refresh}
      />
    );
  return (
    <InvitationAcceptanceGate email={session.user.email ?? ''} onAccepted={access.refresh}>
      {screen}
    </InvitationAcceptanceGate>
  );
}

function BusinessWorkspaceHome() {
  const router = useRouter();
  const account = useAccount();
  const access = useBusinessWorkspace();
  const workspace = access.workspace!;
  const setup = useBusinessSetup(workspace);
  return (
    <BusinessDashboard
      workspace={workspace}
      displayName={account.profile!.display_name}
      setupItems={setup.data ?? []}
      setupLoading={setup.isLoading}
      onBack={() => router.replace('/profile')}
      onSignOut={() => void account.signOut()}
      onEditProfile={() => router.push('/business/profile')}
      onOpenMenu={() => router.push('/business/menu')}
      onOpenContent={() => router.push('/business/content')}
      onOpenRewards={() => router.push('/business/rewards')}
      onOpenTeam={() => router.push('/business/team')}
      onOpenLegal={() => router.push('/business/legal')}
      onReviewApplications={access.isPlatformAdmin ? () => router.push('/business/applications') : undefined}
    />
  );
}
