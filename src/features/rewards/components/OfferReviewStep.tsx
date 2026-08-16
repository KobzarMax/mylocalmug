import { Switch, Text, View } from 'react-native';

import { DateTimeField } from '../../../components/ui/DateTimeField';
import { rewardStyles as s } from '../styles';

type Props = {
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  onStartsAt: (value: string) => void;
  onEndsAt: (value: string) => void;
  onActive: (value: boolean) => void;
};

export function OfferReviewStep(props: Props) {
  return (
    <>
      <DateTimeField label="Starts at" onChange={props.onStartsAt} value={props.startsAt} />
      <DateTimeField label="Ends at" onChange={props.onEndsAt} value={props.endsAt} />
      <View style={[s.row, { marginTop: 14 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Offer enabled</Text>
          <Text style={s.meta}>Disable without deleting its audit history.</Text>
        </View>
        <Switch accessibilityLabel="Offer enabled" value={props.isActive} onValueChange={props.onActive} />
      </View>
      <Text style={s.intro}>
        Review the audience, benefit, usage limit, and customer wording before saving.
      </Text>
    </>
  );
}
