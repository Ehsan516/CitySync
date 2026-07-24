import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { AppColors, Spacing, Type } from "@/constants/app-theme";

type Props = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  // Optional: pass scrollY from useScrollHeader() to get the blurred
  // sticky-bar-on-scroll effect used by Apple's large title nav bars.
  scrollY?: SharedValue<number>;
};

const FADE_DISTANCE = 24;

export default function ScreenHeader({ title, subtitle, rightSlot, scrollY }: Props) {
  const insets = useSafeAreaInsets();

  const bgStyle = useAnimatedStyle(() => {
    "worklet";
    if (!scrollY) return { opacity: 0 };
    return { opacity: interpolate(scrollY.value, [0, FADE_DISTANCE], [0, 1], Extrapolation.CLAMP) };
  });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + Spacing.sm }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, bgStyle]}>
        {Platform.OS === "ios" ? (
          <BlurView tint="systemChromeMaterialDark" intensity={95} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: AppColors.backgroundElevated }]} />
        )}
        <View style={styles.hairline} />
      </Animated.View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  hairline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.separator,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  title: {
    ...Type.largeTitle,
    color: AppColors.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.textMuted,
  },
  rightSlot: {
    paddingTop: 6,
  },
});
