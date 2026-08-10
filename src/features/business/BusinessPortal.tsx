import React, { useState } from 'react';
import { useBusinessAccess } from './hooks';
import { createEmptyApplication } from './types';
import { ApplicationStatusScreen } from './components/ApplicationStatusScreen';
import { BusinessApplicationForm } from './components/BusinessApplicationForm';
import { BusinessDashboard } from './components/BusinessDashboard';
import { BusinessProfileEditor } from './components/BusinessProfileEditor';
import { PortalError, PortalLoading } from './components/BusinessUI';

export function BusinessPortal({ userId, email, displayName, onBack, onSignOut }: {
  userId: string;
  email: string;
  displayName: string;
  onBack: () => void;
  onSignOut: () => void;
}) {
  const access = useBusinessAccess(userId);
  const [editingProfile, setEditingProfile] = useState(false);

  if (access.loading) return <PortalLoading />;
  if (access.error) return <PortalError message={access.error} onRetry={access.refresh} onBack={onBack} />;

  if (access.workspace) {
    return editingProfile
      ? <BusinessProfileEditor workspace={access.workspace} onBack={() => setEditingProfile(false)} onSaved={access.refresh} />
      : <BusinessDashboard workspace={access.workspace} displayName={displayName} onBack={onBack} onSignOut={onSignOut} onEditProfile={() => setEditingProfile(true)} />;
  }

  if (access.application && ['submitted', 'under_review', 'approved'].includes(access.application.status)) {
    return <ApplicationStatusScreen application={access.application} onBack={onBack} onRefresh={access.refresh} />;
  }

  const initial = access.application ?? {
    ...createEmptyApplication(email),
    id: '',
    status: 'draft' as const,
    rejectionReason: null,
  };
  return <BusinessApplicationForm userId={userId} initial={initial} onBack={onBack} onChanged={access.refresh} />;
}
