import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";

import ModeChips from "@/components/travel/ModeChips";
import RouteOptionCard from "@/components/travel/RouteOptionCard";
import LiveStamp from "@/components/travel/LiveStamp";
import LastServiceBanner from "@/components/travel/LastServiceBanner";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { SecBtn } from "@/components/home/ActionBtns";
import { FontFamily, Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useNow } from "@/hooks/useNow";
import { useTravelPlan } from "@/hooks/useTravelPlan";
import { travelApi } from "@/lib/api";
import { arrivalVerdict, formatClock, recommendedOptionIndex } from "@/lib/travelFormat";
import type {
  RouteOption,
  TransitRoutingPref,
  TransitSubMode,
  TravelMode,
  TravelPlanQuery,
} from "@/lib/types";

export type Timing = "leaveNow" | "arriveBy";

const TIMING_OPTIONS = ["Leave now", "Arrive by"];

type Props = {
  origin: string;
  destination: string;

  deadline: Date | null;

  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;

  transitModes: TransitSubMode[];
  onTransitModesChange: (modes: TransitSubMode[]) => void;

  transitRoutingPref?: TransitRoutingPref | null;

  initialTiming?: Timing;

  showLastService?: boolean;

  headerSlot?: React.ReactNode;
};

export default function TravelPlanner({
  origin,
  destination,
  deadline,
  mode,
  onModeChange,
  transitModes,
  onTransitModesChange,
  transitRoutingPref = null,
  initialTiming = "arriveBy",
  showLastService = false,
  headerSlot,
}: Props) {
  const { colors, radius } = useTheme();
  const s = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  const [timing, setTiming] = useState<Timing>(deadline ? initialTiming : "leaveNow");

  const [arriveByAt, setArriveByAt] = useState<Date>(() => deadline ?? new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const deadlineMs = deadline ? deadline.getTime() : null;
  const stableDeadline = useMemo(
    () => (deadlineMs != null ? new Date(deadlineMs) : null),
    [deadlineMs]
  );

  useEffect(() => {
    if (stableDeadline) setArriveByAt(stableDeadline);
  }, [stableDeadline]);

  const now = useNow(1000);

  const query = useMemo<TravelPlanQuery | null>(() => {
    if (!origin.trim() || !destination.trim()) return null;

    return {
      origin: origin.trim(),
      destination: destination.trim(),
      mode,
      arrivalTime: timing === "arriveBy" ? arriveByAt.toISOString() : null,
      departureTime: null,
      transitModes,
      transitRoutingPref,
      alternatives: true,
    };
  }, [origin, destination, mode, timing, arriveByAt, transitModes, transitRoutingPref]);

  const { plan, loading, refreshing, error, computedAt, refresh } = useTravelPlan(query);

  const planKey = plan?.computedAt ?? null;
  const lastPlanKey = useRef<string | null>(null);
  useEffect(() => {
    if (planKey !== lastPlanKey.current) {
      lastPlanKey.current = planKey;
      setExpandedIndex(null);
    }
  }, [planKey]);

  const [lastService, setLastService] = useState<RouteOption | null>(null);
  const [lastServiceLoaded, setLastServiceLoaded] = useState(false);

  useEffect(() => {
    if (!showLastService || mode !== "TRANSIT" || !origin.trim() || !destination.trim()) {
      setLastService(null);
      setLastServiceLoaded(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setLastServiceLoaded(false);

    travelApi
      .getLastService(origin.trim(), destination.trim(), "TRANSIT", transitModes, transitRoutingPref, controller.signal)
      .then((result) => {
        if (!active) return;
        setLastService(result);
        setLastServiceLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLastServiceLoaded(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [showLastService, mode, origin, destination, transitModes, transitRoutingPref]);

  const options = useMemo(() => plan?.options ?? [], [plan]);

  const effectiveDeadline = useMemo(
    () => stableDeadline ?? (timing === "arriveBy" ? arriveByAt : null),
    [stableDeadline, timing, arriveByAt]
  );

  const recommendedIndex = useMemo(
    () => recommendedOptionIndex(options, effectiveDeadline, now),
    [options, effectiveDeadline, now]
  );

  const anyOnTime = useMemo(() => {
    if (!effectiveDeadline) return true;

    return options.some((option) => {
      const verdict = arrivalVerdict(option, effectiveDeadline);
      return verdict.kind === "onTime" || verdict.kind === "tight";
    });
  }, [options, effectiveDeadline]);

  const recommended = recommendedIndex >= 0 ? options[recommendedIndex] : null;
  const lateVerdict = recommended ? arrivalVerdict(recommended, effectiveDeadline) : { kind: "none" as const };

  function onPickTime(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setShowPicker(false);

    if (event.type === "dismissed" || !selected) return;

    setArriveByAt(selected);
  }

  function handleMissedIt() {
    if (timing === "leaveNow") refresh();
    else setTiming("leaveNow");
  }

  return (
    <View style={{ gap: Spacing.md }}>
      {headerSlot}

      <ModeChips
        mode={mode}
        onModeChange={onModeChange}
        transitModes={transitModes}
        onTransitModesChange={onTransitModesChange}
      />

      {deadline ? (
        <SegmentedControl
          options={TIMING_OPTIONS}
          selectedIndex={timing === "leaveNow" ? 0 : 1}
          onChange={(i) => setTiming(i === 0 ? "leaveNow" : "arriveBy")}
        />
      ) : null}

      {timing === "arriveBy" ? (
        <View style={s.timeRow}>
          <Text style={s.timeLabel}>Arrive by</Text>

          <Pressable
            onPress={() => setShowPicker((v) => !v)}
            style={({ pressed }) => [s.timeButton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Change arrival time, currently ${formatClock(arriveByAt.toISOString())}`}
          >
            <Text style={s.timeButtonText}>{formatClock(arriveByAt.toISOString())}</Text>
          </Pressable>
        </View>
      ) : null}

      {showPicker ? (
        <DateTimePicker
          value={arriveByAt}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickTime}
        />
      ) : null}

      <LiveStamp computedAt={computedAt} now={now} refreshing={refreshing} onRefresh={refresh} />

      {showLastService ? (
        <LastServiceBanner lastService={lastService} now={now} loaded={lastServiceLoaded} />
      ) : null}

      {!loading && options.length > 0 && !anyOnTime && effectiveDeadline ? (
        <View style={[s.banner, { backgroundColor: colors.dangerMuted, borderColor: colors.danger }]}>
          <Text style={[s.bannerTitle, { color: colors.danger }]}>
            {lateVerdict.kind === "late"
              ? `You'll be about ${lateVerdict.lateMins} min late`
              : "Nothing gets you there in time"}
          </Text>
          <Text style={s.bannerBody}>
            Every option arrives after {formatClock(effectiveDeadline.toISOString())}. The closest is
            highlighted below.
          </Text>
        </View>
      ) : null}

      {plan?.notice ? <Text style={s.notice}>{plan.notice}</Text> : null}

      {error ? <Text style={s.error}>{error}</Text> : null}

      {loading ? (
        <Text style={s.muted}>Finding routes…</Text>
      ) : options.length === 0 ? (
        <Text style={s.muted}>
          {query
            ? "No journeys found for this trip. Try a different mode or time."
            : "Set your home address in Settings to plan a journey."}
        </Text>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {options.map((option, i) => (
            <RouteOptionCard
              key={`${option.optionIndex}-${option.departureTime ?? i}`}
              option={option}
              deadline={effectiveDeadline}
              now={now}
              recommended={i === recommendedIndex}
              expanded={expandedIndex === i}
              onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
            />
          ))}
        </View>
      )}

      {options.length > 0 ? (
        <SecBtn title="Missed it? Show what's leaving now" onPress={handleMissedIt} />
      ) : null}
    </View>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    timeLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      fontFamily: FontFamily.semibold,
    },
    timeButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.card2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    timeButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
      fontFamily: FontFamily.bold,
      fontVariant: ["tabular-nums"],
    },
    banner: {
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      padding: Spacing.md,
      gap: 4,
    },
    bannerTitle: {
      ...Type.callout,
      fontWeight: "800",
      fontFamily: FontFamily.extrabold,
    },
    bannerBody: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    notice: {
      color: colors.warning,
      fontSize: 12,
      lineHeight: 17,
    },
    error: {
      color: colors.danger,
      fontSize: 12,
      lineHeight: 17,
    },
    muted: {
      color: colors.textMuted,
      fontSize: 13,
      paddingVertical: Spacing.sm,
    },
  });
}
