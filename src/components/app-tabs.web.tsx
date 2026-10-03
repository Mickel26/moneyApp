import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

// Native tabs float at the top of the page on web; for the installed web app (PWA) a classic
// bottom tab bar feels much closer to a real iPhone app.
const TABS = [
  { name: 'index', title: 'Dziś', icon: '💰' },
  { name: 'history', title: 'Historia', icon: '📋' },
  { name: 'stats', title: 'Statystyki', icon: '📊' },
  { name: 'settings', title: 'Ustawienia', icon: '⚙️' },
];

export default function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        // Emoji icons are taller than the default icon box, so give the bar a bit more room.
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border, height: 58 + insets.bottom },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 19, lineHeight: 24, opacity: focused ? 1 : 0.45 }}>{tab.icon}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
