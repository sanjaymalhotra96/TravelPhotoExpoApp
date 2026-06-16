import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { Icons } from '../../theme';

export default function TabsLayout() {
  const { colorScheme } = useThemeStore();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#191924' : '#ffffff',
          borderTopColor: isDark ? '#282838' : '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8b5cf6', // Indigo-500
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#64748b',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Studio',
          tabBarIcon: ({ color, size }) => (
            <Icons.Grid size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icons.User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
