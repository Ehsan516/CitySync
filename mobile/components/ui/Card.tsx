import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { AppColors, Radius, Spacing } from "@/constants/app-theme";

type Props = ViewProps & { elevated?: boolean };

export default function Card({ style, children, elevated, ...rest }: Props) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.card,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    padding: Spacing.lg,
  },
  elevated: {
    backgroundColor: AppColors.card2,
  },
});
