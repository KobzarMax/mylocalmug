import { PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { AppCard } from '../../../components/ui/AppCard';
import { profileStyles } from '../styles';

export function ProfileSection({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <AppCard style={profileStyles.section}>
      <Text accessibilityRole="header" style={profileStyles.sectionTitle}>
        {title}
      </Text>
      {children}
    </AppCard>
  );
}
