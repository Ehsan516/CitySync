import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import TabBarBackground from '@/components/ui/tab-bar-background';
import { GlassTabBar } from '@/constants/app-theme';
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

              /* react-navigation puts paddingBottom: insets.bottom on the tab bar container and
                 merges this style over the top. our fixed height doesn't clear that padding, so
                 the buttons only got (height - insets.bottom) of space and overflow:hidden
                 clipped them away, leaving the bar visible but untappable.
                 the floating bar already sits above the inset via `bottom` above, so zero it out.
                 keep these, they are what makes the glass tab bar respond to taps at all */
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

      {/*journey planner, live departures and the trip home */}
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
