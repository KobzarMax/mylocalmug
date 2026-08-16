import { ReactNode } from 'react';

import { StateView } from '../../components/ui/StateView';

import { useBusinessWorkspace } from './BusinessWorkspaceProvider';
import { hasPermission } from './permissions';
import { Permission, Workspace } from './types';

export function RequireBusinessWorkspace({
  children,
  permission,
}: {
  children: (workspace: Workspace) => ReactNode;
  permission?: Permission | Permission[];
}) {
  const access = useBusinessWorkspace();
  if (access.loading) return <StateView kind="loading" title="Opening business workspace…" />;
  if (access.error)
    return (
      <StateView
        kind="error"
        title="Business workspace unavailable"
        message={access.error}
        onRetry={access.refresh}
      />
    );
  if (!access.workspace)
    return (
      <StateView
        kind="empty"
        title="Business access required"
        message="Complete an application or accept an invitation before opening this section."
      />
    );
  const required = permission ? (Array.isArray(permission) ? permission : [permission]) : [];
  if (required.length > 0 && !required.some((item) => hasPermission(access.workspace!.role, item))) {
    return (
      <StateView
        kind="error"
        title="Access not available"
        message="Your business role does not include permission for this section."
      />
    );
  }
  return children(access.workspace);
}
