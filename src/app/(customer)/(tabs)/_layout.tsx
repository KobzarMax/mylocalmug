import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { palette } from '../../../lib/design';

const icons = {
  discover: ['compass-outline', 'compass'],
  rewards: ['ticket-outline', 'ticket'],
  news: ['newspaper-outline', 'newspaper'],
  profile: ['person-outline', 'person'],
} as const;

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.green,
        tabBarInactiveTintColor: palette.disabled,
        tabBarStyle: { backgroundColor: palette.paper, borderTopColor: palette.line, height: 70 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', paddingBottom: 6 },
        tabBarIcon: ({ color, focused, size }) => {
          const pair = icons[route.name as keyof typeof icons] ?? icons.discover;
          return <Ionicons name={focused ? pair[1] : pair[0]} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Rewards' }} />
      <Tabs.Screen name="news" options={{ title: 'News' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
