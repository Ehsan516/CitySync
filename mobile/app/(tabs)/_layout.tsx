import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import TabBarBackground from '@/components/ui/tab-bar-background';
import { AppColors } from '@/constants/app-theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarStyle: Platform.select({
          ios: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: AppColors.separator,
          },
          default: {
            backgroundColor: AppColors.card,
            borderTopColor: AppColors.border,
          },
        }),
      }}>
      {/* Modules and cw CRUD */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Modules',
          tabBarIcon: ({ color }) => (<IconSymbol size={26} name="house.fill" color={color} />),
        }}
      />


      {/* Unified weekly calendar and leave-soon alerts */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color }) => (<IconSymbol size={26} name="calendar" color={color} />),
        }}
      />

      {/*Calendar source picker (should be uni one but can add others) */}
      <Tabs.Screen
        name="calendarSettings"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => ( <IconSymbol size={26} name="list.bullet" color={color} />),

        }}
      />

      {/*user preferences home, buffer, destination */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (<IconSymbol size={26} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
