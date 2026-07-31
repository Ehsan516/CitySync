import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Radius, Spacing, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import { MODE_LABELS, TRANSIT_SUB_MODE_LABELS } from "@/lib/travelFormat";
import { TRANSIT_SUB_MODES, TRAVEL_MODES, type TransitSubMode, type TravelMode } from "@/lib/types";

type Props = {
  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;

  transitModes: TransitSubMode[];
  onTransitModesChange: (modes: TransitSubMode[]) => void;
};

export default function ModeChips({ mode, onModeChange, transitModes, onTransitModesChange }: Props) {
  const { colors, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  function pickMode(next: TravelMode) {
    if (next === mode) return;
    Haptics.selectionAsync();
    onModeChange(next);
  }

  function toggleTransitMode(sub: TransitSubMode) {
    Haptics.selectionAsync();

    if (transitModes.includes(sub)) {
      onTransitModesChange(transitModes.filter((m) => m !== sub));
    } else {
      onTransitModesChange([...transitModes, sub]);
    }
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {TRAVEL_MODES.map((m) => {
          const active = m === mode;
          return (
            <Pressable
              key={m}
              onPress={() => pickMode(m)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Travel by ${MODE_LABELS[m]}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{MODE_LABELS[m]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {mode === "TRANSIT" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          keyboardShouldPersistTaps="handled"
        >
          {TRANSIT_SUB_MODES.map((sub) => {
            const active = transitModes.includes(sub);
            return (
              <Pressable
                key={sub}
                onPress={() => toggleTransitMode(sub)}
                style={({ pressed }) => [
                  styles.subChip,
                  active && styles.subChipActive,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${active ? "Exclude" : "Include"} ${TRANSIT_SUB_MODE_LABELS[sub]}`}
              >
                <Text style={[styles.subChipText, active && styles.subChipTextActive]}>
                  {TRANSIT_SUB_MODE_LABELS[sub]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: Spacing.sm,
      paddingRight: Spacing.lg,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.card2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontWeight: "700",
      fontSize: 13,
    },
    chipTextActive: {
      color: "#fff",
    },
    subChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    subChipActive: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accent,
    },
    subChipText: {
      color: colors.textMuted,
      fontWeight: "600",
      fontSize: 12,
    },
    subChipTextActive: {
      color: colors.accent,
    },
  });
}
