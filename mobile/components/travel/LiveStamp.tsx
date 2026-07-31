import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Spacing, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import { formatStaleness } from "@/lib/travelFormat";

type Props = {
  computedAt: Date | null;
  now: number;
  refreshing: boolean;
  onRefresh: () => void;
};

const STALE_AFTER_MS = 120_000;

export default function LiveStamp({ computedAt, now, refreshing, onRefresh }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const stale = computedAt == null || now - computedAt.getTime() > STALE_AFTER_MS;
  const dotColor = refreshing ? colors.accent : stale ? colors.warning : colors.success;

  return (
    <Pressable
      onPress={onRefresh}
      disabled={refreshing}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel="Refresh travel times"
      hitSlop={8}
    >
      {refreshing ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}

      <Text style={styles.text}>
        {refreshing ? "Refreshing…" : `${stale ? "Updated" : "Live ·"} ${formatStaleness(computedAt, now)}`}
      </Text>

      {!refreshing ? <Text style={styles.action}>Refresh</Text> : null}
    </Pressable>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    text: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    action: {
      marginLeft: "auto",
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
