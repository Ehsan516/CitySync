import React from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useNavigation, useRoute } from "@react-navigation/native";

export const TAB_ORDER = ["index", "calendar", "calendarSettings", "travel", "explore"] as const;

const SWIPE_DISTANCE = 60;

export function useAdjacentTabJump() {
  const navigation = useNavigation<any>();
  const route = useRoute();

  return function jumpBy(direction: 1 | -1) {
    const currentIndex = TAB_ORDER.indexOf(route.name as (typeof TAB_ORDER)[number]);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;

    navigation.jumpTo(TAB_ORDER[nextIndex]);
  };
}

type Props = {
  children: React.ReactNode;
};

export default function SwipeTabScreen({ children }: Props) {
  const jumpBy = useAdjacentTabJump();

  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -SWIPE_DISTANCE) runOnJS(jumpBy)(1);
      else if (e.translationX > SWIPE_DISTANCE) runOnJS(jumpBy)(-1);
    });

  return (
    <GestureDetector gesture={swipe}>
      <View collapsable={false} style={{ flex: 1 }}>
        {children}
      </View>
    </GestureDetector>
  );
}
