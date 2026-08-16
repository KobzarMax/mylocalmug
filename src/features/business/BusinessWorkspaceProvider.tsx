import { createContext, PropsWithChildren, useContext } from 'react';

import { useAccount } from '../auth/AccountProvider';

import { useBusinessAccess } from './hooks';

type BusinessContextValue = ReturnType<typeof useBusinessAccess>;

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessWorkspaceProvider({ children }: PropsWithChildren) {
  const { session } = useAccount();
  const access = useBusinessAccess(session?.user.id ?? '');
  return <BusinessContext.Provider value={access}>{children}</BusinessContext.Provider>;
}

export function useBusinessWorkspace() {
  const access = useContext(BusinessContext);
  if (!access) throw new Error('useBusinessWorkspace must be used inside BusinessWorkspaceProvider.');
  return access;
}
