import { Switch, Text, TextInput, View } from 'react-native';

import { DateTimeField } from '../../../components/ui/DateTimeField';
import { rewardColors, rewardStyles as s } from '../styles';

import { RewardField } from './RewardFormControls';

type Props = {
  startsAt: string;
  endsAt: string;
  tiers: string;
  terms: string;
  onStartsAt: (value: string) => void;
  onEndsAt: (value: string) => void;
  onTiers: (value: string) => void;
  onTerms: (value: string) => void;
};

export function ProgrammeReviewStep(props: Props) {
  return (
    <>
      <Text style={s.sectionTitle}>Schedule</Text>
      <Text style={s.meta}>Times use the timezone shown on this device.</Text>
      <DateTimeField label="Starts at" onChange={props.onStartsAt} value={props.startsAt} />
      <DateTimeField label="Ends at" onChange={props.onEndsAt} value={props.endsAt} />
      <Text style={s.sectionTitle}>Loyalty tiers</Text>
      <Text style={s.meta}>
        One per line, for example “Silver: 100”. Unlocked tiers never disappear through redemption.
      </Text>
      <TextInput
        accessibilityLabel="Loyalty tiers"
        style={[s.field, { minHeight: 100, textAlignVertical: 'top' }]}
        multiline
        value={props.tiers}
        onChangeText={props.onTiers}
      />
      <RewardField label="Customer terms" value={props.terms} onChangeText={props.onTerms} multiline />
      <View style={s.row}>
        <Switch
          accessibilityLabel="Balances do not expire"
          value
          disabled
          trackColor={{ true: rewardColors.mint }}
        />
        <Text style={[s.meta, { flex: 1 }]}>
          Balances do not expire. Pausing stops earning but keeps redemption available.
        </Text>
      </View>
      <Text style={s.intro}>
        Review the programme terms before saving. Publishing remains a separate explicit action.
      </Text>
    </>
  );
}
