import React, { useMemo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Radius, Spacing, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

type Props = ViewProps & { elevated?: boolean };

export default function Card({ style, children, elevated, ...rest }: Props) {
  const { colors, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  return (
    <View style={[styles.card, elevated && styles.elevated, style]} {...rest}>
      {children}
    </View>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: Spacing.lg,
    },
    elevated: {
      backgroundColor: colors.card2,
    },
  });
}
