import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Card from "@/components/ui/Card";
import { AppColors, Spacing, Type } from "@/constants/app-theme";

type Props = {
  stats: { modules: number; coursework: number; pending: number };
};

function Stat({ label, value, tint }: { label: string; value: number; tint?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, tint ? { color: tint } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HeaderCard({ stats }: Props) {
  return (
    <Card style={styles.header}>
      <View style={styles.row}>
        <Stat label="Modules" value={stats.modules} />
        <View style={styles.divider} />
        <Stat label="Coursework" value={stats.coursework} />
        <View style={styles.divider} />
        <Stat
          label="Pending"
          value={stats.pending}
          tint={stats.pending > 0 ? AppColors.warning : AppColors.success}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: Spacing.lg },
  row: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { ...Type.title1, color: AppColors.text },
  statLabel: { ...Type.footnote, color: AppColors.textMuted, fontWeight: "600" },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: AppColors.separator,
  },
});
