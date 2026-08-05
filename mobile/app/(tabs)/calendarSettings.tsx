import React, { useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, Text, View, Switch, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import * as Calendar from "expo-calendar";
import { getSelectedCalendarIds, setSelectedCalendarIds, clearSelectedCalendarIds,} from "@/lib/prefs";
import {PrimBtn, SecBtn} from "@/components/home/ActionBtns";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SwipeTabScreen from "@/components/ui/SwipeTabScreen";
import Card from "@/components/ui/Card";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useTabBarPadding } from "@/hooks/use-tab-bar-padding";
import { FontFamily, Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

type CalRow = {//calendar object for rendering
  id: string;
  title: string;
  source?: string;
  type?: string;
  allowsModifications?: boolean;
};

function Pill({ label, colors }: { label: string; colors: ColorTokens }) {
//ui for displaying data
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>
        {label}
      </Text>
    </View>
  );
}

export default function CalendarSettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tabBarPadding = useTabBarPadding();

  const [status, setStatus] = useState("idle");//ui state for loading status msgs
  const [cals, setCals] = useState<CalRow[]>([]);//all calendars on device
  const [selected, setSelected] = useState<Record<string, boolean>>({}); //calendar ideas with boolean for toggle

  const selectedCount = useMemo(//counting cals selected
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  async function loadCalendars() {
  //load calemdars from device and save selection
    setStatus("requesting calendar permission...");
    const perm = await Calendar.requestCalendarPermissionsAsync();
    if (perm.status !== "granted") {
    //block if perms denied
      setStatus("permission denied");
      Alert.alert("Permission needed", "Enable calendar permission to select timetable calendars..");
      return;
    }

    setStatus("loading calendars...");
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    const rows: CalRow[] = calendars.map((c) => ({
    //map expo cal obj into simple structure
      id: c.id,
      title: c.title ?? "(no title)",
      source: (c as any).source?.name ?? undefined,
      type: String((c as any).type ?? ""),
      allowsModifications: c.allowsModifications,
    }));

    //gets prev saved selection from storage
    const saved = await getSelectedCalendarIds();
    const nextSel: Record<string, boolean> = {};
    for (const r of rows) {nextSel[r.id] = saved ? saved.includes(r.id) : false;}

    setCals(rows);
    setSelected(nextSel);
    setStatus(`loaded ${rows.length} calendars`);
  }

  useEffect(() => {
  //runs once to fetch calendars
    loadCalendars().catch((e) => Alert.alert("Error", String(e?.message ?? e)));
  }, []);

  async function save() {
  //func to save selection
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

    if (ids.length === 0) {
    //at least one calendar selected
      Alert.alert("Select at least one","Pick your timetable calendar so CitySync knows what to include.");
      return;
    }

    await setSelectedCalendarIds(ids);
    Alert.alert("Saved", `Citysync will use ${ids.length} selected calendar(s) for your unified timetable :D`);
  }

  function confirmSave(){
  //funciton so that users know that their calendar perfs will be saved
    Alert.alert(
    "Use selected calendars?","Citysync reads events only form the calendars you selected to build the unified calendar",
    [{text: "cancel",style:"cancel",},{
        text:"continue", onPress: () => {
            save().catch((e) => Alert.alert("save error", String(e)));
        },
    },

    ]
    );
  }

  async function reset() {
  //calers calendar selects and reload
    await clearSelectedCalendarIds();
    await loadCalendars();
    Alert.alert("Reset", "Cleared timetable calendar selection.");
  }

  const { scrollY, onScroll } = useScrollHeader();

  return (
    <SwipeTabScreen>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Timetable Calendars" subtitle={status} scrollY={scrollY} />
      <Animated.ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 + tabBarPadding, gap: Spacing.md }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
      {/*header card */}
        <Card>
          <Text style={styles.introText}>
            Citysync reads events only form the calendars you selected to build the unified calendar
          </Text>

          <View style={styles.pillRow}>

            <Pill label={`Calendars: ${cals.length}`} colors={colors} />
            <Pill label={`Selected: ${selectedCount}`} colors={colors} />
          </View>

          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>

              <PrimBtn title="Save selection" onPress={confirmSave}/>
            </View>
            <View style={{ flex: 1 }}>

              <SecBtn title="Reset" onPress={() => {
                  reset().catch((e) => Alert.alert("Reset error", String(e)));
                }}
              />
            </View>
          </View>
        </Card>

        {/* List */}
        {cals.map((c) => (
          <Card key={c.id} style={styles.calRow}>
            <View style={{ flex: 1 }}>
            <Text style={styles.calTitle}>

              {c.title}
            </Text>

            <Text style={styles.calSub}>

              {c.source ? `Source: ${c.source}` : "Source: n/a"}
              {c.type ? ` • Type: ${c.type}` : ""}
              {/*^show souce and calendar type if available, otherwise fallback */}
            </Text>

            <Text style={styles.calMuted}>
              {/*whether this calendar can be modified via api */}
              Writable: {c.allowsModifications ? "yes" : "no"}
            </Text>

            <Text
              style={styles.calId}
              numberOfLines={1} //truncate long calendar IDs to a single line
            >
              {c.id}
            </Text>

            </View>

            <Switch
              value={!!selected[c.id]}
              onValueChange={(v) => setSelected((prev) => ({ ...prev, [c.id]: v }))}
              trackColor={{ false: colors.fill, true: colors.primary }}
              thumbColor="#fff"
            />
          </Card>
        ))}
      </Animated.ScrollView>
    </SafeAreaView>
    </SwipeTabScreen>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    introText: { color: colors.textSecondary, lineHeight: 20 },
    pillRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md, flexWrap: "wrap" },
    actionRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md + 2 },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: colors.card2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pillText: { color: colors.textSecondary, fontWeight: "600", fontFamily: FontFamily.semibold, fontSize: 12 },
    calRow: {
      flexDirection: "row",
      gap: Spacing.md,
      alignItems: "center",
      justifyContent: "space-between",
    },
    calTitle: { ...Type.callout, color: colors.text, fontSize: 16, fontWeight: "800", fontFamily: FontFamily.extrabold },
    calSub: { color: colors.textSecondary, marginTop: 2 },
    calMuted: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
    calId: { color: colors.textTertiary, fontSize: 11, marginTop: 6 },
  });
}
