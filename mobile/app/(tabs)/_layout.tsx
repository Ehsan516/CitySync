import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      {/* Modules and cw CRUD */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Modules',
          tabBarIcon: ({ color }) => (<IconSymbol size={28} name="house.fill" color={color} />),
        }}
      />


      {/* Unified weekly calendar and leave-soon alerts */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Timetable',
          tabBarIcon: ({ color }) => (<IconSymbol size={28} name="calendar" color={color} />),
        }}
      />

      {/*Calendar source picker (should be uni one but can add others) */}
      <Tabs.Screen
        name="calendarSettings"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color }) => ( <IconSymbol size={28} name="list.bullet" color={color} />),

        }}
      />

      {/*user preferences home, buffer, destination */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (<IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
