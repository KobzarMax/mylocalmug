import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { resolveBusinessTheme } from './theme';
import { BusinessBrandPalette, ResolvedBusinessTheme } from './types';

const BusinessThemeContext = createContext<ResolvedBusinessTheme>(resolveBusinessTheme());

export function BusinessThemeProvider({
  palette,
  children,
}: PropsWithChildren<{ palette: BusinessBrandPalette }>) {
  const theme = useMemo(() => resolveBusinessTheme(palette), [palette]);
  return <BusinessThemeContext.Provider value={theme}>{children}</BusinessThemeContext.Provider>;
}

export const useBusinessTheme = () => useContext(BusinessThemeContext);
