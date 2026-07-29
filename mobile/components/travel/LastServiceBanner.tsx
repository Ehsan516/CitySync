import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Radius, Spacing, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import { formatClock, formatCountdown, parseIso } from "@/lib/travelFormat";
import type { RouteOption } from "@/lib/types";

type Props = {
  lastService: RouteOption | null;
  now: number;
  /**null while still being fetched, so we don't claim "no services" prematurely*/
  loaded: boolean;
};

//start shouting about the last train when it's this close
const URGENT_WITHIN_MS = 90 * 60_000;

/**last train home warning
 *
 * the case this exists for: it's late, you're still on campus, and you need to know whether
 * you're about to get stranded. severity escalates as the final departure approaches
 */
export default function LastServiceBanner({ lastService, now, loaded }: Props) {
  const { colors, radius } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  if (!loaded) return null;

  //no last service found means either no transit at all today or the day is over
  if (!lastService) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.dangerMuted, borderColor: colors.danger }]}>
        <Text style={[styles.title, { color: colors.danger }]}>No more services today</Text>
        <Text style={styles.body}>
          CitySync couldn&apos;t find a public transport route home later today. Check another mode or
          plan to stay nearby.
        </Text>
      </View>
    );
  }

  const departure = parseIso(lastService.departureTime);
  if (!departure) return null;

  const msAway = departure.getTime() - now;
  const gone = msAway < -60_000;
  const urgent = !gone && msAway <= URGENT_WITHIN_MS;

  //quietly stay out of the way when the last train is still hours off
  if (!gone && !urgent) return null;

  const tone = gone ? colors.danger : colors.warning;
  const toneMuted = gone ? colors.dangerMuted : colors.warningMuted;

  return (
    <View style={[styles.banner, { backgroundColor: toneMuted, borderColor: tone }]}>
      <Text style={[styles.title, { color: tone }]}>
        {gone ? "Last service has gone" : `Last service home ${formatCountdown(lastService.departureTime, now)}`}
      </Text>

      <Text style={styles.body}>
        {gone
          ? `The final departure was ${formatClock(lastService.departureTime)}. You'll need another way home.`
          : `Departs ${formatClock(lastService.departureTime)}, arriving ${formatClock(
              lastService.arrivalTime
            )}. Don't leave it any later.`}
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    banner: {
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.md,
      gap: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: "800",
    },
    body: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
  });
}
