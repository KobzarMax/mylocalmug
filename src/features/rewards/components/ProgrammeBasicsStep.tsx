import { Text, View } from 'react-native';

import { rewardStyles as s } from '../styles';

import { RewardChip, RewardField } from './RewardFormControls';

type Props = {
  type: 'stamp' | 'points';
  method: 'item' | 'spend';
  name: string;
  description: string;
  singular: string;
  plural: string;
  rate: string;
  onType: (value: 'stamp' | 'points') => void;
  onMethod: (value: 'item' | 'spend') => void;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  onSingular: (value: string) => void;
  onPlural: (value: string) => void;
  onRate: (value: string) => void;
};

export function ProgrammeBasicsStep(props: Props) {
  return (
    <>
      <Text style={s.intro}>
        Choose a proven earning model. Material edits create a new auditable version.
      </Text>
      <Text style={s.label}>Programme type</Text>
      <View style={s.wrap}>
        {(['stamp', 'points'] as const).map((value) => (
          <RewardChip
            key={value}
            label={value}
            active={props.type === value}
            onPress={() => props.onType(value)}
          />
        ))}
      </View>
      {props.type === 'points' ? (
        <>
          <Text style={s.sectionTitle}>Earning method</Text>
          <View style={s.wrap}>
            {(['item', 'spend'] as const).map((value) => (
              <RewardChip
                key={value}
                label={value === 'item' ? 'Points per item' : 'Points per £1'}
                active={props.method === value}
                onPress={() => props.onMethod(value)}
              />
            ))}
          </View>
        </>
      ) : null}
      <RewardField label="Name" value={props.name} onChangeText={props.onName} />
      <RewardField
        label="Description"
        value={props.description}
        onChangeText={props.onDescription}
        multiline
      />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <RewardField label="Singular unit" value={props.singular} onChangeText={props.onSingular} />
        </View>
        <View style={{ flex: 1 }}>
          <RewardField label="Plural unit" value={props.plural} onChangeText={props.onPlural} />
        </View>
      </View>
      {props.method === 'spend' ? (
        <RewardField
          label="Points per £1"
          value={props.rate}
          onChangeText={props.onRate}
          keyboardType="number-pad"
        />
      ) : null}
    </>
  );
}
