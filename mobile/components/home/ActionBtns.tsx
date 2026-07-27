import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Radius, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BtnProps = { title: string; onPress: () => void; disabled?: boolean };

function usePressScale() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withTiming(0.96, { duration: 90 });
  };
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 140 });
  };
  return { style, onPressIn, onPressOut };
}

export function GlassLayer({ colors, tint }: { colors: ColorTokens; tint: string }) {
  return (
    <>
      {Platform.OS === "ios" ? (
        <BlurView tint={colors.blurTint} intensity={60} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
    </>
  );
}

export function PrimBtn({ title, onPress, disabled }: BtnProps) {
  const { colors, glass, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);
  const { style, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      onPress={() => {
        if (!disabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[styles.btn, glass ? styles.btnPrimaryGlass : styles.btnPrimaryFlat, disabled && styles.btnDisabled, style]}
    >
      {glass ? <GlassLayer colors={colors} tint={colors.primaryGlassBg} /> : null}
      <Text style={styles.btnPrimaryText}>{title}</Text>
    </AnimatedPressable>
  );
}

export function SecBtn({ title, onPress, disabled }: BtnProps) {
  const { colors, glass, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);
  const { style, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[styles.btn, glass ? styles.btnSecondaryGlass : styles.btnSecondaryFlat, disabled && styles.btnDisabled, style]}
    >
      {glass ? <GlassLayer colors={colors} tint={colors.glassBg} /> : null}
      <Text style={styles.btnSecondaryText}>{title}</Text>
    </AnimatedPressable>
  );
}

export function DangerBtn({ title, onPress, disabled }: BtnProps) {
  const { colors, glass, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);
  const { style, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      onPress={() => {
        if (!disabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[styles.btn, glass ? styles.btnDangerGlass : styles.btnDangerFlat, disabled && styles.btnDisabled, style]}
    >
      {glass ? <GlassLayer colors={colors} tint={colors.dangerGlassBg} /> : null}
      <Text style={styles.btnDangerText}>{title}</Text>
    </AnimatedPressable>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    btn: {
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    btnPrimaryFlat: { backgroundColor: colors.primary, borderRadius: radius.md },
    btnPrimaryGlass: {
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassStroke,
    },
    btnPrimaryText: { color: "white", ...Type.headline },

    btnSecondaryFlat: {
      backgroundColor: colors.fillSecondary,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: radius.md,
    },
    btnSecondaryGlass: {
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassStroke,
    },
    btnSecondaryText: { color: colors.text, ...Type.callout },

    btnDangerFlat: {
      backgroundColor: colors.dangerMuted,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: radius.md,
    },
    btnDangerGlass: {
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassStroke,
    },
    btnDangerText: { color: colors.danger, ...Type.headline, fontSize: 15 },

    btnDisabled: { opacity: 0.4 },
  });
}
