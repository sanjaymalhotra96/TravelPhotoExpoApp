import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS, Icons } from '@/theme';
import { t } from '@/utils/i18n';

export default function TabsLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.studio.tabLabel'),
          tabBarIcon: ({ color, size }) => (
            <Icons.Grid size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile.tabLabel'),
          tabBarIcon: ({ color, size }) => (
            <Icons.User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
