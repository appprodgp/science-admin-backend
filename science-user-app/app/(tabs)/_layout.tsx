import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { colors, spacing } from '../../theme';

type TabIconProps = {
  symbol: string;
  color: ColorValue;
};

function TabIcon({ symbol, color }: TabIconProps) {
  return <Text style={{ color, fontSize: 22 }}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderTopColor: colors.outlineVariant,
          minHeight: 72,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <TabIcon symbol="✦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: 'Streaks',
          tabBarIcon: ({ color }) => <TabIcon symbol="🔥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ color }) => <TabIcon symbol="◆" color={color} />,
        }}
      />
    </Tabs>
  );
}
