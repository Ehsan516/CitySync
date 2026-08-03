import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { useFocusEffect } from "expo-router";

import TravelPlanner from "@/components/travel/TravelPlanner";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Card from "@/components/ui/Card";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { FontFamily, Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useTabBarPadding } from "@/hooks/use-tab-bar-padding";
import { getUserId, preferencesApi } from "@/lib/api";
import { getLastEventEndToday } from "@/lib/deviceCalendar";
import {
  getCachedTransitModes,
  getCachedTravelMode,
  setCachedTransitModes,
  setCachedTravelMode,
} from "@/lib/prefs";
import { formatClock } from "@/lib/travelFormat";
import type { TransitRoutingPref, TransitSubMode, TravelMode } from "@/lib/types";

const CityCampDest = "City St George's, University of London, Northampton Square, London EC1V 0HB";

const DIRECTION_OPTIONS = ["To uni", "Back home"];

type Direction = "outbound" | "return";

export default function TravelScreen() {
  const { colors, radius } = useTheme();
  const s = useMemo(() => makeStyles(colors, radius), [colors, radius]);
  const tabBarPadding = useTabBarPadding();
  const { scrollY, onScroll } = useScrollHeader();

  const [home, setHome] = useState("");
  const [uni, setUni] = useState(CityCampDest);

  const [fromOverride, setFromOverride] = useState<string | null>(null);
  const [toOverride, setToOverride] = useState<string | null>(null);

  const [direction, setDirection] = useState<Direction>("outbound");

  const [mode, setMode] = useState<TravelMode>("TRANSIT");
  const [transitModes, setTransitModes] = useState<TransitSubMode[]>([]);
  const [transitRoutingPref, setTransitRoutingPref] = useState<TransitRoutingPref | null>(null);

  const [status, setStatus] = useState("loading preferences...");

  const [lastEventEnd, setLastEventEnd] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const [cachedMode, cachedSubModes] = await Promise.all([
        getCachedTravelMode(),
        getCachedTransitModes(),
      ]);

      setMode(cachedMode);
      setTransitModes(cachedSubModes);
    })();
  }, []);

  const loadPrefs = useCallback(async () => {
    try {
      const userId = await getUserId();
      const prefs = await preferencesApi.get(userId);

      setHome(prefs.homeAddress ?? "");
      setUni(prefs.UniLoc?.trim() || CityCampDest);

      if (prefs.preferredMode) setMode(prefs.preferredMode);
      if (prefs.transitModes) setTransitModes(prefs.transitModes);
      setTransitRoutingPref(prefs.transitRoutingPref ?? null);

      setStatus(prefs.homeAddress ? "" : "Set your home address in Settings");
    } catch {
      setStatus("Couldn't load your saved locations");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPrefs();
      void getLastEventEndToday().then(setLastEventEnd);
    }, [loadPrefs])
  );

  function handleModeChange(next: TravelMode) {
    setMode(next);
    void setCachedTravelMode(next);
  }

  function handleTransitModesChange(next: TransitSubMode[]) {
    setTransitModes(next);
    void setCachedTransitModes(next);
  }

  const outbound = direction === "outbound";

  const from = fromOverride ?? (outbound ? home : uni);
  const to = toOverride ?? (outbound ? uni : home);

  const deadline = outbound ? lastEventEnd : null;

  function swap() {
    setDirection(outbound ? "return" : "outbound");
    setFromOverride(null);
    setToOverride(null);
  }

  const header = (
    <Card style={s.card}>
      <SegmentedControl
        options={DIRECTION_OPTIONS}
        selectedIndex={outbound ? 0 : 1}
        onChange={(i) => {
          setDirection(i === 0 ? "outbound" : "return");
          setFromOverride(null);
          setToOverride(null);
        }}
      />

      <View style={s.field}>
        <Text style={s.fieldLabel}>From</Text>
        <TextInput
          value={from}
          onChangeText={setFromOverride}
          placeholder="Start address or postcode"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          style={s.input}
        />
      </View>

      <View style={s.field}>
        <Text style={s.fieldLabel}>To</Text>
        <TextInput
          value={to}
          onChangeText={setToOverride}
          placeholder="Destination address or postcode"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          style={s.input}
        />
      </View>

      <Pressable
        onPress={swap}
        style={({ pressed }) => [s.swapBtn, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel="Swap start and destination"
      >
        <Text style={s.swapText}>⇅ Swap</Text>
      </Pressable>

      {outbound && lastEventEnd ? (
        <Text style={s.hint}>
          Aiming to arrive by {formatClock(lastEventEnd.toISOString())}, the end of your last event
          today.
        </Text>
      ) : null}

      {!outbound ? (
        <Text style={s.hint}>
          Planning your trip home. CitySync will warn you if the last service is close.
        </Text>
      ) : null}
    </Card>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Travel" subtitle={status || undefined} scrollY={scrollY} />

      <Animated.ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Spacing.xl + tabBarPadding }]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TravelPlanner
          origin={from}
          destination={to}
          deadline={deadline}
          mode={mode}
          onModeChange={handleModeChange}
          transitModes={transitModes}
          onTransitModesChange={handleTransitModesChange}
          transitRoutingPref={transitRoutingPref}
          initialTiming={outbound ? "arriveBy" : "leaveNow"}
          showLastService={!outbound}
          headerSlot={header}
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: Spacing.xl, gap: Spacing.lg },
    card: { gap: Spacing.md },
    field: { gap: 4 },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: FontFamily.semibold,
      color: colors.textSecondary,
    },
    input: {
      backgroundColor: colors.card2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: 12,
      color: colors.text,
      fontSize: 15,
    },
    swapBtn: { alignSelf: "flex-start" },
    swapText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      fontFamily: FontFamily.bold,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
    },
    title: { ...Type.headline, color: colors.text },
  });
}
