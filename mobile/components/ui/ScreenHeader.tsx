import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  scrollY?: SharedValue<number>;
};

const FADE_DISTANCE = 24;

export default function ScreenHeader({ title, subtitle, rightSlot, scrollY }: Props) {
  const { colors, glass } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const bgStyle = useAnimatedStyle(() => {
    "worklet";
    if (!scrollY) return { opacity: glass ? 0.6 : 0 };
    const floor = glass ? 0.55 : 0;
    return { opacity: interpolate(scrollY.value, [0, FADE_DISTANCE], [floor, 1], Extrapolation.CLAMP) };
  });

  return (
    <View style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, bgStyle]}>
        {Platform.OS === "ios" ? (
          <BlurView tint={colors.blurTint} intensity={glass ? 70 : 95} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backgroundElevated }]} />
        )}
        {glass ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]} /> : null}
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

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.md,
    },
    hairline: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
    },
    title: {
      ...Type.largeTitle,
      color: colors.text,
    },
    subtitle: {
      marginTop: 2,
      fontSize: 13,
      fontWeight: "600",
      color: colors.textMuted,
    },
    rightSlot: {
      paddingTop: 6,
    },
  });
}
