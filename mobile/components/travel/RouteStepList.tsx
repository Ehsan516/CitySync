import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Spacing, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import { formatClock, formatDuration, vehicleLabel } from "@/lib/travelFormat";
import type { RouteStepDto } from "@/lib/types";

type Props = {
  steps: RouteStepDto[];
};

/**step by step breakdown of one journey
 * lifted out of the timetable route modal so the travel tab and the sheet render steps
 * identically instead of drifting apart*/
export default function RouteStepList({ steps }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (steps.length === 0) {
    return <Text style={styles.empty}>No step details for this route.</Text>;
  }

  return (
    <View>
      {steps.map((step, i) => {
        const isTransit = step.mode?.toUpperCase() === "TRANSIT";

        //google gives brand colours as hex, use them for the line badge when present
        const badgeBg = step.lineColor ?? colors.fillSecondary;
        const badgeFg = step.lineTextColor ?? colors.text;

        const vehicle = vehicleLabel(step.vehicleType);

        return (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepIndex}>{i + 1}</Text>

              {isTransit && step.lineName ? (
                <View style={[styles.lineBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.lineBadgeText, { color: badgeFg }]} numberOfLines={1}>
                    {step.lineName}
                  </Text>
                </View>
              ) : null}

              {vehicle ? <Text style={styles.stepKicker}>{vehicle}</Text> : null}

              {step.durationSeconds != null ? (
                <Text style={styles.stepDuration}>{formatDuration(step.durationSeconds)}</Text>
              ) : null}
            </View>

            <Text style={styles.stepTitle}>{step.instruction}</Text>

            {isTransit ? (
              <View style={styles.transitDetail}>
                {step.departureStop ? (
                  <Text style={styles.stepMeta}>
                    <Text style={styles.stepMetaTime}>{formatClock(step.departureTime)}</Text>
                    {`  ${step.departureStop}`}
                  </Text>
                ) : null}

                {step.arrivalStop ? (
                  <Text style={styles.stepMeta}>
                    <Text style={styles.stepMetaTime}>{formatClock(step.arrivalTime)}</Text>
                    {`  ${step.arrivalStop}`}
                  </Text>
                ) : null}

                <Text style={styles.stepSubMeta}>
                  {[
                    step.headSign ? `Towards ${step.headSign}` : null,
                    step.stopCount != null
                      ? `${step.stopCount} ${step.stopCount === 1 ? "stop" : "stops"}`
                      : null,
                    step.agencyName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    empty: {
      color: colors.textMuted,
      fontSize: 13,
      paddingVertical: Spacing.sm,
    },
    stepRow: {
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginBottom: 6,
    },
    stepIndex: {
      color: colors.textTertiary,
      fontWeight: "800",
      fontSize: 12,
      minWidth: 14,
    },
    lineBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      maxWidth: 160,
    },
    lineBadgeText: {
      fontSize: 12,
      fontWeight: "800",
    },
    stepKicker: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    stepDuration: {
      marginLeft: "auto",
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    stepTitle: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 14,
      lineHeight: 19,
    },
    transitDetail: {
      marginTop: 6,
      gap: 2,
    },
    stepMeta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    stepMetaTime: {
      color: colors.text,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    stepSubMeta: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
  });
}
