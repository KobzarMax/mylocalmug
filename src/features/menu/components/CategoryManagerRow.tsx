import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MenuCategoryIcon } from '../../../components/MenuCategoryIcon';
import { palette } from '../../../lib/design';
import { categoryStyles as s } from '../categoryStyles';
import { MenuCategory } from '../types';

type Props = {
  category: MenuCategory;
  itemCount: number;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function CategoryManagerRow(props: Props) {
  return (
    <View style={s.row}>
      <View style={s.rowHeader}>
        <View style={s.rowIcon} accessibilityLabel={`${props.category.name} category icon`}>
          <MenuCategoryIcon iconKey={props.category.iconKey} size={24} />
        </View>
        <View style={s.rowCopy}>
          <Text style={s.rowName}>{props.category.name}</Text>
          <Text style={s.rowCount}>
            {props.itemCount} item{props.itemCount === 1 ? '' : 's'}
          </Text>
        </View>
        <RowAction
          disabled={props.busy}
          icon="pencil-outline"
          accessibilityLabel={`Edit ${props.category.name}`}
          onPress={props.onEdit}
        />
        <RowAction
          danger
          disabled={props.busy}
          icon="trash-outline"
          accessibilityLabel={`Delete ${props.category.name}`}
          onPress={props.onDelete}
        />
      </View>
    </View>
  );
}

function RowAction({
  icon,
  accessibilityLabel,
  disabled,
  danger,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  disabled: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.rowAction, danger && s.rowActionDanger, disabled && s.disabled]}
    >
      <Ionicons name={icon} size={20} color={danger ? palette.orange : palette.green} />
    </Pressable>
  );
}
