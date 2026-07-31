import React, { useMemo } from "react";
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import TravelPlanner from "@/components/travel/TravelPlanner";
import { Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import type { TransitRoutingPref, TransitSubMode, TravelMode } from "@/lib/types";

export type RouteSheetTarget = {
  title: string;
  origin: string;
  destination: string;
  deadline: Date | null;
};

type Props = {
  visible: boolean;
  target: RouteSheetTarget | null;
  onClose: () => void;

  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;

  transitModes: TransitSubMode[];
  onTransitModesChange: (modes: TransitSubMode[]) => void;

  transitRoutingPref?: TransitRoutingPref | null;
};

export default function RouteSheet({
  visible,
  target,
  onClose,
  mode,
  onModeChange,
  transitModes,
  onTransitModesChange,
  transitRoutingPref = null,
}: Props) {
  const { colors, radius } = useTheme();
  const s = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={s.sheetHandle} />

        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Route details</Text>

          {target ? <Text style={s.sheetSubtitle}>{target.title}</Text> : null}

          {target ? (
            <Text style={s.sheetRoute} numberOfLines={2}>
              {target.origin} → {target.destination}
            </Text>
          ) : null}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
        >
          {target ? (
            <TravelPlanner
              origin={target.origin}
              destination={target.destination}
              deadline={target.deadline}
              mode={mode}
              onModeChange={onModeChange}
              transitModes={transitModes}
              onTransitModesChange={onTransitModesChange}
              transitRoutingPref={transitRoutingPref}
              initialTiming="arriveBy"
            />
          ) : (
            <Text style={s.muted}>No route selected.</Text>
          )}
        </ScrollView>

        <View style={s.sheetFooter}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Text style={s.closeBtnText}>Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    sheetHandle: {
      alignSelf: "center",
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.fill,
      marginTop: 8,
    },
    sheetHeader: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    sheetTitle: { ...Type.title3, color: colors.text },
    sheetSubtitle: { color: colors.textSecondary, marginTop: 6, fontWeight: "600" },
    sheetRoute: { color: colors.textMuted, marginTop: 4, fontSize: 12, lineHeight: 17 },
    body: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
    },
    muted: { color: colors.textMuted, fontSize: 13 },
    sheetFooter: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    closeBtn: { alignSelf: "center" },
    closeBtnText: { color: colors.accent, fontSize: 16, fontWeight: "600" },
  });
}
