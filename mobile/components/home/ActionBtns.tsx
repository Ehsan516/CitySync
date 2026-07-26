import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AppColors, Radius, Type } from "@/constants/app-theme";

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

export function PrimBtn({ title, onPress, disabled }: BtnProps) {
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
      style={[styles.btnPrimary, disabled && styles.btnDisabled, style]}
    >
      <Text style={styles.btnPrimaryText}>{title}</Text>
    </AnimatedPressable>
  );
}

export function SecBtn({ title, onPress, disabled }: BtnProps) {
  const { style, onPressIn, onPressOut } = usePressScale();
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={[styles.btnSecondary, disabled && styles.btnDisabled, style]}
    >
      <Text style={styles.btnSecondaryText}>{title}</Text>
    </AnimatedPressable>
  );
}

export function DangerBtn({ title, onPress, disabled }: BtnProps) {
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
      style={[styles.btnDanger, disabled && styles.btnDisabled, style]}
    >
      <Text style={styles.btnDangerText}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btnPrimary: {
    backgroundColor: AppColors.primary,
    paddingVertical: 13,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  btnPrimaryText: { color: "white", ...Type.headline },

  btnSecondary: {
    backgroundColor: AppColors.fillSecondary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  btnSecondaryText: { color: AppColors.text, ...Type.callout },

  btnDanger: {
    backgroundColor: AppColors.dangerMuted,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  btnDangerText: { color: AppColors.danger, ...Type.headline, fontSize: 15 },

  btnDisabled: { opacity: 0.4 },
});
