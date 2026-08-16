import { createContext, PropsWithChildren, useContext } from 'react';

import { useAuthenticatedAccount } from './sessionHooks';

type AccountContextValue = ReturnType<typeof useAuthenticatedAccount>;

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: PropsWithChildren) {
  const account = useAuthenticatedAccount();
  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error('useAccount must be used inside AccountProvider.');
  return account;
}
