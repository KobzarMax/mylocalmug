import { Pressable, Text, TextInput, View } from 'react-native';

import { palette as appPalette } from '../../../lib/design';
import { BusinessBrandPalette } from '../types';

import { BrandPalettePreview } from './BrandPalettePreview';

const swatches = ['#235C4B', '#2F5D8A', '#704C8A', '#9A4D42', '#D06E38', '#E2A43B', '#F7F2EA', '#24201D'];

export function BrandPaletteEditor({
  name,
  value,
  editable,
  error,
  onChange,
  onReset,
}: {
  name: string;
  value: BusinessBrandPalette;
  editable: boolean;
  error: string | null;
  onChange: (key: keyof BusinessBrandPalette, value: string) => void;
  onReset: () => void;
}) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ color: appPalette.ink, fontSize: 18, fontWeight: '800' }}>Brand colours</Text>
      <Text style={{ color: appPalette.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>
        These colours appear on your customer profile and published stories.
      </Text>
      {(['primary', 'accent', 'background'] as const).map((key) => (
        <View key={key} style={{ marginTop: 16 }}>
          <Text
            style={{
              color: appPalette.muted,
              fontSize: 10,
              fontWeight: '900',
              textTransform: 'uppercase',
              marginBottom: 7,
            }}
          >
            {key}
          </Text>
          <TextInput
            accessibilityLabel={`${key} brand colour hex value`}
            autoCapitalize="characters"
            editable={editable}
            maxLength={7}
            onChangeText={(next) => onChange(key, next)}
            value={value[key]}
            style={{
              minHeight: 48,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: appPalette.line,
              backgroundColor: appPalette.paper,
              color: appPalette.ink,
              paddingHorizontal: 14,
            }}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {swatches.map((swatch) => (
              <Pressable
                key={swatch}
                accessibilityRole="radio"
                accessibilityLabel={`Use ${swatch} as ${key}`}
                accessibilityState={{ checked: value[key].toUpperCase() === swatch, disabled: !editable }}
                disabled={!editable}
                onPress={() => onChange(key, swatch)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: swatch,
                  borderWidth: value[key].toUpperCase() === swatch ? 3 : 1,
                  borderColor: value[key].toUpperCase() === swatch ? appPalette.ink : appPalette.line,
                }}
              />
            ))}
          </View>
        </View>
      ))}
      {error ? (
        <Text
          accessibilityLiveRegion="assertive"
          style={{ color: appPalette.orange, fontSize: 12, marginTop: 10 }}
        >
          {error}
        </Text>
      ) : null}
      {editable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset brand colours"
          onPress={onReset}
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}
        >
          <Text style={{ color: appPalette.green, fontSize: 12, fontWeight: '800' }}>
            Reset to Local Mug colours
          </Text>
        </Pressable>
      ) : null}
      <BrandPalettePreview name={name} palette={value} />
    </View>
  );
}
