import { Pressable, Text, View } from 'react-native';

import { MenuCategoryIcon } from '../../../components/MenuCategoryIcon';
import { MENU_CATEGORY_ICONS, MenuCategoryIconKey } from '../../../lib/menuCategoryIcons';
import { categoryStyles as s } from '../categoryStyles';

export function CategoryIconPicker({
  value,
  disabled,
  onChange,
}: {
  value: MenuCategoryIconKey;
  disabled: boolean;
  onChange: (key: MenuCategoryIconKey) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Category icon" style={s.iconGrid}>
      {MENU_CATEGORY_ICONS.map((entry) => {
        const selected = value === entry.key;
        return (
          <Pressable
            key={entry.key}
            accessibilityRole="radio"
            accessibilityLabel={`${entry.label} icon`}
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(entry.key)}
            style={[s.iconChoice, selected && s.iconChoiceSelected, disabled && s.disabled]}
          >
            <MenuCategoryIcon iconKey={entry.key} size={24} />
            <Text style={[s.iconChoiceText, selected && s.iconChoiceTextSelected]}>{entry.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
