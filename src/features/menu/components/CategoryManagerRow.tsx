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
  first: boolean;
  last: boolean;
  busy: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
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
      </View>
      <View style={s.rowActions}>
        <RowAction
          disabled={props.busy || props.first}
          icon="arrow-up"
          label="Up"
          accessibilityLabel={`Move ${props.category.name} up`}
          onPress={props.onMoveUp}
        />
        <RowAction
          disabled={props.busy || props.last}
          icon="arrow-down"
          label="Down"
          accessibilityLabel={`Move ${props.category.name} down`}
          onPress={props.onMoveDown}
        />
        <RowAction
          disabled={props.busy}
          icon="pencil-outline"
          label="Edit"
          accessibilityLabel={`Edit ${props.category.name}`}
          onPress={props.onEdit}
        />
        <RowAction
          danger
          disabled={props.busy}
          icon="trash-outline"
          label="Delete"
          accessibilityLabel={`Delete ${props.category.name}`}
          onPress={props.onDelete}
        />
      </View>
    </View>
  );
}

function RowAction({
  icon,
  label,
  accessibilityLabel,
  disabled,
  danger,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
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
      <Ionicons name={icon} size={17} color={danger ? palette.orange : palette.green} />
      <Text style={[s.rowActionText, danger && s.rowActionDangerText]}>{label}</Text>
    </Pressable>
  );
}
