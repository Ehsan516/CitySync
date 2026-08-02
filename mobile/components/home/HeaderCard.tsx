import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "@/components/ui/Card";
import { FontFamily, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  stats: { modules: number; coursework: number; pending: number };
};

function Stat({ label, value, tint, colors }: { label: string; value: number; tint?: string; colors: ColorTokens }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HeaderCard({ stats }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Card style={styles.header}>
      <View style={styles.row}>
        <Stat label="Modules" value={stats.modules} colors={colors} />
        <View style={styles.divider} />
        <Stat label="Coursework" value={stats.coursework} colors={colors} />
        <View style={styles.divider} />
        <Stat
          label="Pending"
          value={stats.pending}
          tint={stats.pending > 0 ? colors.warning : colors.success}
          colors={colors}
        />
      </View>
    </Card>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    header: { paddingVertical: Spacing.lg },
    row: { flexDirection: "row", alignItems: "center" },
    stat: { flex: 1, alignItems: "center", gap: 2 },
    statValue: { ...Type.title1, color: colors.text },
    statLabel: { ...Type.footnote, color: colors.textMuted, fontWeight: "600", fontFamily: FontFamily.semibold },
    divider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: "stretch",
      backgroundColor: colors.separator,
    },
  });
}
