import { Dispatch, SetStateAction } from 'react';
import { Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';
import { MenuChoice } from '../types';

import { RewardChip, RewardField } from './RewardFormControls';

type Props = {
  method: 'item' | 'spend';
  grouped: [string, MenuChoice[]][];
  menu: MenuChoice[];
  selected: string[];
  selectedCategories: string[];
  units: Record<string, string>;
  setSelected: Dispatch<SetStateAction<string[]>>;
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  setUnits: Dispatch<SetStateAction<Record<string, string>>>;
};

export function ProgrammeEligibilityStep(props: Props) {
  if (props.method === 'spend')
    return (
      <Text style={s.intro}>Customers earn points from their final eligible spend after discounts.</Text>
    );
  const toggle = (values: string[], setValues: Dispatch<SetStateAction<string[]>>, id: string) =>
    setValues(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  return (
    <>
      <Text style={s.sectionTitle}>Eligible categories</Text>
      <View style={s.wrap}>
        {props.grouped
          .flatMap(([, items]) => (items[0]?.categoryId ? [items[0]] : []))
          .map((item) => (
            <RewardChip
              key={item.categoryId!}
              label={item.categoryName}
              active={props.selectedCategories.includes(item.categoryId!)}
              onPress={() => toggle(props.selectedCategories, props.setSelectedCategories, item.categoryId!)}
            />
          ))}
      </View>
      <Text style={s.sectionTitle}>Eligible individual items</Text>
      {props.grouped.map(([category, items]) => (
        <View key={category}>
          <Text style={s.label}>{category}</Text>
          <View style={s.wrap}>
            {items.map((item) => (
              <RewardChip
                key={item.id}
                label={item.name}
                active={props.selected.includes(item.id)}
                onPress={() => toggle(props.selected, props.setSelected, item.id)}
              />
            ))}
          </View>
        </View>
      ))}
      {[...props.selectedCategories, ...props.selected].map((id) => (
        <RewardField
          key={id}
          label={`Units for ${props.menu.find((item) => item.id === id)?.name ?? props.menu.find((item) => item.categoryId === id)?.categoryName ?? 'selection'}`}
          value={props.units[id] ?? '1'}
          onChangeText={(value) => props.setUnits((current) => ({ ...current, [id]: value }))}
          keyboardType="number-pad"
        />
      ))}
    </>
  );
}
