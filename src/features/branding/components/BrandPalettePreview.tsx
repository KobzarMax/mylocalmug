import { Text, View } from 'react-native';

import { resolveBusinessTheme } from '../theme';
import { BusinessBrandPalette } from '../types';

export function BrandPalettePreview({ name, palette }: { name: string; palette: BusinessBrandPalette }) {
  const theme = resolveBusinessTheme(palette);
  return (
    <View style={{ padding: 14, borderRadius: 16, backgroundColor: theme.background }}>
      <View
        style={{
          padding: 14,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surface,
        }}
      >
        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
          Preview
        </Text>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 5 }}>
          {name || 'Your coffee shop'}
        </Text>
        <Text style={{ color: theme.mutedText, fontSize: 12, marginTop: 5 }}>
          News, menus, and profile details use this palette.
        </Text>
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 11,
            backgroundColor: theme.primary,
          }}
        >
          <Text style={{ color: theme.primaryForeground, fontWeight: '800' }}>Primary action</Text>
        </View>
      </View>
    </View>
  );
}
