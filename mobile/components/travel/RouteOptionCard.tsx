import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Radius, Spacing, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import RouteStepList from "@/components/travel/RouteStepList";
import {
  arrivalVerdict,
  formatClock,
  formatCountdown,
  formatDuration,
  formatTransfers,
  hasDeparted,
  verdictLabel,
} from "@/lib/travelFormat";
import type { RouteOption } from "@/lib/types";

type Props = {
  option: RouteOption;
  /**the moment the user needs to have arrived by, drives the on time/late badge.
   * null when planning a trip with no deadline, eg heading home*/
  deadline: Date | null;
  now: number;//ticking clock from useNow, keeps countdowns live without api calls
  recommended: boolean;
  expanded: boolean;
  onToggle: () => void;
};

/**one row of the departure board
 * collapsed it answers "when does it go and will I make it", expanded it shows every step*/
export default function RouteOptionCard({
  option,
  deadline,
  now,
  recommended,
  expanded,
  onToggle,
}: Props) {
  const { colors, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  const departed = hasDeparted(option, now);
  const countdown = formatCountdown(option.departureTime, now);
  const verdict = arrivalVerdict(option, deadline);
  const verdictText = verdictLabel(verdict);

  const verdictColor =
    verdict.kind === "late" ? colors.danger : verdict.kind === "tight" ? colors.warning : colors.success;

  //the first transit leg is what the user is actually trying to catch
  const firstTransit = option.steps.find((s) => s.mode?.toUpperCase() === "TRANSIT");

  const subtitleParts = [
    formatTransfers(option.transferCount),
    option.walkingSeconds != null && option.walkingSeconds > 0
      ? `${formatDuration(option.walkingSeconds)} walking`
      : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.card,
        recommended && styles.cardRecommended,
        departed && styles.cardDeparted,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`Departs ${formatClock(option.departureTime)}, arrives ${formatClock(
        option.arrivalTime
      )}, ${formatDuration(option.durationSeconds)}${verdictText ? `, ${verdictText}` : ""}`}
    >
      {recommended ? (
        <Text style={styles.recommendedKicker}>
          {verdict.kind === "late" ? "CLOSEST OPTION" : "BEST OPTION"}
        </Text>
      ) : null}

      <View style={styles.topRow}>
        <View style={styles.timeBlock}>
          <Text style={[styles.departTime, departed && styles.mutedText]}>
            {formatClock(option.departureTime)}
          </Text>
          <Text style={styles.arriveTime}>arrive {formatClock(option.arrivalTime)}</Text>
        </View>

        <View style={styles.rightBlock}>
          <Text style={[styles.duration, departed && styles.mutedText]}>
            {formatDuration(option.durationSeconds)}
          </Text>

          {countdown ? (
            <Text style={[styles.countdown, departed && styles.countdownDeparted]}>{countdown}</Text>
          ) : null}
        </View>
      </View>

      {firstTransit?.lineName ? (
        <View style={styles.lineRow}>
          <View
            style={[
              styles.lineBadge,
              { backgroundColor: firstTransit.lineColor ?? colors.fillSecondary },
            ]}
          >
            <Text
              style={[styles.lineBadgeText, { color: firstTransit.lineTextColor ?? colors.text }]}
              numberOfLines={1}
            >
              {firstTransit.lineName}
            </Text>
          </View>

          {firstTransit.departureStop ? (
            <Text style={styles.fromStop} numberOfLines={1}>
              from {firstTransit.departureStop}
            </Text>
          ) : null}
        </View>
      ) : option.summary ? (
        <Text style={styles.summary} numberOfLines={2}>
          {option.summary}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        {subtitleParts.length > 0 ? (
          <Text style={styles.meta}>{subtitleParts.join(" · ")}</Text>
        ) : null}

        {verdictText ? (
          <Text style={[styles.verdict, { color: verdictColor }]}>{verdictText}</Text>
        ) : null}
      </View>

      {departed ? <Text style={styles.departedNote}>Already gone — pick a later option</Text> : null}

      <Text style={styles.expandHint}>{expanded ? "Hide steps ⌃" : "Show steps ⌄"}</Text>

      {expanded ? (
        <View style={styles.steps}>
          <RouteStepList steps={option.steps} />
        </View>
      ) : null}
    </Pressable>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: 6,
    },
    cardRecommended: {
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    cardDeparted: {
      opacity: 0.55,
    },
    recommendedKicker: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
    },
    timeBlock: {
      flex: 1,
    },
    departTime: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    arriveTime: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 1,
      fontVariant: ["tabular-nums"],
    },
    rightBlock: {
      alignItems: "flex-end",
    },
    duration: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    countdown: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },
    countdownDeparted: {
      color: colors.textTertiary,
    },
    mutedText: {
      color: colors.textMuted,
    },
    lineRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    lineBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      maxWidth: 150,
    },
    lineBadgeText: {
      fontSize: 12,
      fontWeight: "800",
    },
    fromStop: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 12,
    },
    summary: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    meta: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 12,
    },
    verdict: {
      fontSize: 12,
      fontWeight: "800",
    },
    departedNote: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: "600",
    },
    expandHint: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    steps: {
      marginTop: 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
  });
}
