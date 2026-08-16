import React, { useState } from 'react';
import { useBusinessAccess } from './hooks';
import { createEmptyApplication } from './types';
import { ApplicationStatusScreen } from './components/ApplicationStatusScreen';
import { BusinessApplicationForm } from './components/BusinessApplicationForm';
import { BusinessDashboard } from './components/BusinessDashboard';
import { BusinessProfileEditor } from './components/BusinessProfileEditor';
import { PortalError, PortalLoading } from './components/BusinessUI';
import { AdminReviewQueue } from './components/AdminReviewQueue';
import { TeamEntry } from '../team/TeamEntry';
import { InvitationAcceptanceGate } from '../team/InvitationAcceptanceGate';
import { MenuEntry } from '../menu/MenuEntry';
import { BusinessContentEntry } from '../content/BusinessContentEntry';
import { PaymentsEntry } from '../payments/PaymentsEntry';
import { RewardsEntry } from '../rewards/RewardsEntry';

export function BusinessPortal({ userId, email, displayName, onBack, onSignOut }: {
  userId: string;
  email: string;
  displayName: string;
  onBack: () => void;
  onSignOut: () => void;
}) {
  const access = useBusinessAccess(userId);
  const [editingProfile, setEditingProfile] = useState(false);
  const [reviewingApplications, setReviewingApplications] = useState(false);
  const [managingTeam, setManagingTeam] = useState(false);
  const [managingMenu, setManagingMenu] = useState(false);
  const [managingContent, setManagingContent] = useState(false);
  const [managingPayments, setManagingPayments] = useState(false);
  const [managingRewards, setManagingRewards] = useState(false);

  if (access.loading) return <PortalLoading />;
  if (access.error) return <PortalError message={access.error} onRetry={access.refresh} onBack={onBack} />;
  if (access.isPlatformAdmin && reviewingApplications) {
    return <AdminReviewQueue onBack={() => setReviewingApplications(false)} />;
  }
  if (access.workspace && managingTeam) {
    return <TeamEntry workspace={access.workspace} onBack={() => setManagingTeam(false)} />;
  }
  if (access.workspace && managingMenu) {
    return <MenuEntry workspace={access.workspace} onBack={() => setManagingMenu(false)} />;
  }
  if (access.workspace && managingContent) {
    return <BusinessContentEntry workspace={access.workspace} onBack={() => setManagingContent(false)} />;
  }
  if (access.workspace && managingPayments) {
    return <PaymentsEntry workspace={access.workspace} onBack={() => setManagingPayments(false)} />;
  }
  if (access.workspace && managingRewards) {
    return <RewardsEntry workspace={access.workspace} onBack={() => setManagingRewards(false)} />;
  }

  if (access.workspace) {
    return editingProfile
      ? <BusinessProfileEditor workspace={access.workspace} onBack={() => setEditingProfile(false)} onSaved={access.refresh} />
      : <BusinessDashboard workspace={access.workspace} displayName={displayName} onBack={onBack} onSignOut={onSignOut} onEditProfile={() => setEditingProfile(true)} onOpenMenu={() => setManagingMenu(true)} onOpenContent={() => setManagingContent(true)} onOpenRewards={() => setManagingRewards(true)} onOpenTeam={() => setManagingTeam(true)} onOpenPayments={() => setManagingPayments(true)} onReviewApplications={access.isPlatformAdmin ? () => setReviewingApplications(true) : undefined} />;
  }

  if (access.isPlatformAdmin) {
    return <AdminReviewQueue onBack={onBack} />;
  }

  const initial = access.application ?? {
    ...createEmptyApplication(email),
    id: '',
    status: 'draft' as const,
    rejectionReason: null,
  };
  const applicationScreen = access.application && ['submitted', 'under_review', 'approved'].includes(access.application.status)
    ? <ApplicationStatusScreen application={access.application} onBack={onBack} onRefresh={access.refresh} />
    : <BusinessApplicationForm userId={userId} initial={initial} onBack={onBack} onChanged={access.refresh} />;
  return <InvitationAcceptanceGate email={email} onAccepted={access.refresh}>{applicationScreen}</InvitationAcceptanceGate>;
}
