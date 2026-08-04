import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import TabBarBackground from '@/components/ui/tab-bar-background';
import { FontFamily, GlassTabBar } from '@/constants/app-theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colors, glass, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: FontFamily.semibold,
        },
        tabBarStyle: glass
          ? {
              position: 'absolute',
              left: GlassTabBar.sideMargin,
              right: GlassTabBar.sideMargin,
              bottom: insets.bottom + GlassTabBar.bottomMargin,
              height: GlassTabBar.height,
              borderRadius: radius.pill,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.glassStroke,
              overflow: 'hidden',
              elevation: 0,

              paddingBottom: 0,
              paddingTop: 0,
              paddingHorizontal: 0,
            }
          : Platform.select({
              ios: {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.separator,
              },
              default: {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
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

      <Tabs.Screen
        name="travel"
        options={{
          title: 'Travel',
          tabBarIcon: ({ color }) => (<IconSymbol size={26} name="tram.fill" color={color} />),
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
