import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1c1917',
        tabBarInactiveTintColor: '#a8a29e',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '600', color: '#1c1917' },
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e7e5e4' },
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerTitle: 'Gathered',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'Prayers',
          headerTitle: 'Gathered',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Gathered',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
