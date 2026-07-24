import React, { useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, Text, View, Modal, Pressable, ScrollView, StyleSheet, Switch } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import * as Calendar from "expo-calendar";

import { getSelectedCalendarIds, getOnSiteToday, setOnSiteToday } from "@/lib/prefs";
import { getUserId, courseworkApi, preferencesApi, travelApi } from "@/lib/api";
import { startOfWeek, addDays, ymd } from "@/lib/dateUtils";
import type { CourseworkDto, TravelDetails, UnifiedItem } from "@/lib/types";
import UnifiedWeekView from "@/components/calendar/UnifiedWeekView";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { SecBtn } from "@/components/home/ActionBtns";
import { AppColors, Spacing, Type } from "@/constants/app-theme";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import {
  cancelAllLeaveSoonNotifs,
  calcLeaveTime,
  estimateMinsHomeUnifb,
  persistLeaveSoonNotifIds,
  scheduleTravelNotifs,
} from "@/src/notifications/leaveSoonNotifications";

const CityCampDest = "City St George's, University of London, Northampton Square, London EC1V 0HB";

function parseCwDate(dateTimeString: string) {
    return new Date(dateTimeString);
    //full iso string for cw items for calendar view
}

export default function CalendarScreen() {
  const [status, setStatus] = useState("idle");
  const [sections, setSections] = useState<{ title: string; data: UnifiedItem[] }[]>([]);

  const [weekAnch, setWeekAnch] = useState(new Date());
  const weekStart = useMemo(() => startOfWeek(weekAnch), [weekAnch]);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const [buffer, setBuffer] = useState<number>(10);
  const [homeLocation, setHomeLocationState] = useState<string>("");
  const [destination, setDestination] = useState<string>(CityCampDest);
  //default destination city camppus but can be changed in prefs

  const [prefsLoaded, setPrefsLoaded] = useState(false);//stops calendar form loading until prefs are ready
  const [onSiteMode, setOnSiteMode] = useState(false);//on-site toggle,resets daily

  const[routeModalVisible, setRouteModalVisible] = useState(false);//toggling route modal screen
  const[routeLoading, setRouteLoading] = useState(false);//show loading state while fetching route

  const[selectedRoute,setSelectedRoute] = useState<TravelDetails | null>(null);
  const[selectedRouteTitle,setSelectedRouteTitle] = useState("");
  //stores selected route and event title

  function nextWeek(){//func so user can see next week
    setWeekAnch((prev) => addDays(prev, 7));
  }

  function prevWeek(){
    setWeekAnch((prev) => addDays(prev, -7));
  }

  function currentWeek(){
    setWeekAnch(new Date());//goes back to current week
  }

  const isCurrentWeek = ymd(weekStart) === ymd(startOfWeek(new Date()));

  const weekSwipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -40) {
        runOnJS(nextWeek)();
      } else if (e.translationX > 40) {
        runOnJS(prevWeek)();
      }
    });

  async function handleOnSiteToggle(value: boolean){//toggle for on site si bitifs are reloaded
    setOnSiteMode(value);
    await setOnSiteToday(value);
    await loadUnifiedWeek();
  }

  useEffect(() => {
  (async () => {
  //wrapped async for errors
    try{
        const USER_ID = await getUserId();//gets user id when logged in to fetch pref

        const prefs = await preferencesApi.get(USER_ID);

        setBuffer(prefs.bufferMins ?? 10);//if no val from backend then 10 default
        setHomeLocationState(prefs.homeAddress ?? "");
        //^no leave time notif if home address not set
        setDestination(prefs.UniLoc?.trim() || CityCampDest);//use destination if present but uni campus as fallback
        setOnSiteMode(await getOnSiteToday());//load todays on-site state
    } catch{
        //default if pref loading fails
    } finally{
      setPrefsLoaded(true);
      //lets unified calendar load
    }
    })();
  }, []);

  async function openRouteDetails(item: UnifiedItem) {//activates when user taps the route detail button
    if (
    item.source !== "timetable" && !(item.source === "coursework" && item.onSite)){
     return;//only timetable items and one-site cw items have routes
    }
    if (!homeLocation || homeLocation.trim() === "") {
      Alert.alert("No home address", "set your home address in prefs first");
      //they gte an alert is home address isn't set
      return;
    }

    try {
      setRouteLoading(true);
      setSelectedRoute(null);
      setSelectedRouteTitle(item.title);//store evnt title for display
      setRouteModalVisible(true);//opens route modal screen

      const targetDest = item.source === "coursework" ? (item.location?.trim() || destination) : destination;

      const arrivalTime = item.source === "coursework" ? item.end.toISOString() : item.start.toISOString();//correct arrival time for backend
                                                                                  //^start arrive at beginning of lecture

       const details = await travelApi.getDetails(//func to fetch route details form backend
        homeLocation,
        targetDest,
        arrivalTime
      );

      if (!details) {//if no data was returned
        setSelectedRoute(null);
        Alert.alert("Route details unavailable", "Could not load detailed route steps");
        return;
      }

      setSelectedRoute(details);
    } catch (e: any) {
      Alert.alert("Route details error", String(e?.message ?? e));
      setRouteModalVisible(false);//closes modal screen if error
    } finally {
      setRouteLoading(false);
    }
  }

  async function loadUnifiedWeek() {
    setStatus("requesting calendar permission...");
    try {
      const USER_ID = await getUserId();

      let currentBuffer = 10;
      let currentHome = "";
      let currentDest = CityCampDest;
      //temp prefs in case api fails^

      try {
        const prefs = await preferencesApi.get(USER_ID);
        //response to userpref dto using await for async parse

        currentBuffer = prefs.bufferMins ?? 10;
        currentHome = prefs.homeAddress ?? "";
        currentDest = prefs.UniLoc?.trim() || CityCampDest;
        //prefs are used if exists else default vals

        setBuffer(currentBuffer);
        setHomeLocationState(currentHome);
        setDestination(currentDest);
        //react state updates for ui
      } catch {
        //keep defaults if prefs fetch fails
      }

      const onSite = await getOnSiteToday();
      setOnSiteMode(onSite);//reread in case stored day changed

      const perm = await Calendar.requestCalendarPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Calendar permission needed", "Enable calendar permission to import timetable events.");
        setStatus("calendar permission denied");
        return;
      }

      setStatus("loading device calendar events...");
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);


      //read saved calendar selection first, else fall back to all calendars
      const savedIds = await getSelectedCalendarIds();
      let calIds: string[];

      if (savedIds && savedIds.length > 0) {

        const existingIds = new Set(calendars.map((c) => c.id));
        calIds = savedIds.filter((id) => existingIds.has(id));
        //^keeps only saved calendars that still exist on the device

        if (calIds.length === 0) {

          calIds = calendars.map((c) => c.id);
          setStatus("saved calendars unavailable, using all calendars...");//fallback if previously saved calendars were removed from device

        } else {

          setStatus(`using ${calIds.length} selected calendar(s)...`);
        }

      } else {

        calIds = calendars.map((c) => c.id);
        setStatus("no calendars selected — using all. Pick calendars in the Cal. Source tab.");
        //^uses all calendars until user makes a selection in the calendar source tab
      }

      //fetch all events within the week range
      const deviceEvents = await Calendar.getEventsAsync(calIds, weekStart, weekEnd);

      const bufferMins = currentBuffer;
      //from the backend


      //cancel old leave alerts before we schedule new ones
      await cancelAllLeaveSoonNotifs();


      const scheduledNotifIds: string[] = [];

      const timetableItems: UnifiedItem[] = await Promise.all(
        deviceEvents.map(async (e) => {
          const start = new Date(e.startDate);
          const end = new Date(e.endDate);
          const location = e.location ?? undefined;

          let leaveMeta = "";
          let routeMeta = "";

          if(onSite){
            routeMeta = "on site mode-travel alerts paused for today :D";
          }else{
          //fixed destination so travel should be Home to City campus
          const eventArrivalTime =start.toISOString();

          const liveTravelMins = await travelApi.getDurationMinutes(currentHome,currentDest, eventArrivalTime);
          const travelMins = liveTravelMins ?? estimateMinsHomeUnifb(currentHome);

          if (travelMins != null) {
            const leaveAt = calcLeaveTime(start, travelMins, bufferMins);

            const notifIds = await scheduleTravelNotifs(e.title ?? "Lecture",leaveAt, travelMins,bufferMins, false);

            scheduledNotifIds.push(...notifIds);

            leaveMeta = `Leave at ${leaveAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

            const usedFallback = liveTravelMins == null;
            routeMeta = `Route: Home -> ${currentDest} (${travelMins} mins${usedFallback ? " est." : ""})`;
          } else {

            routeMeta = "Set home address in preferences to get leave time";
          }

          }
          const calName = calendars.find((c) => c.id === e.calendarId)?.title ?? e.calendarId;
          const calMeta = calName ? `Calendar ${calName}` : "";
          //^shows which selected calendar the event came from

          const meta = [leaveMeta, routeMeta, calMeta].filter(Boolean).join(" • ") || undefined;

          return {key: `tt-${e.id}`,source: "timetable" as const, title: e.title ?? "(no title)",start,end,location,meta,};
        })
      );

      setStatus("loading coursework from backend...");
      let coursework: CourseworkDto[];
      try {
        coursework = await courseworkApi.listAll(USER_ID);
      } catch (e: any) {
        Alert.alert("Coursework load failed", String(e?.bodyText ?? e?.message ?? e));
        setStatus(`coursework load failed`);
        return;
      }

      const courseworkItems: UnifiedItem[] = await Promise.all( //cw items with travel and notificaiton info
        coursework.map(async (c) => {
          const end = parseCwDate(c.dueDate); //parsing actual deadline into js date
          const start = new Date(end);
          start.setMinutes(start.getMinutes() - 30);//show as a 30 min block

          let leaveMeta = "";//leave at txt
          let routeMeta = "";//route: text

          const location = c.onSite ? (c.location?.trim() || currentDest) : undefined;//set location if cw/exam is on site
          //fallback to uni campus destination of no custom loc

          if (c.onSite) {
          //only travel time and leave soon notifs

            const arrivalTime = end.toISOString();//cw arrival time is deadline

            const liveTravelMins = await travelApi.getDurationMinutes(//getting live travel time from backend
              currentHome,
              location ?? currentDest,
              arrivalTime
            );

            const travelMins = liveTravelMins ?? estimateMinsHomeUnifb(currentHome);

            if (travelMins != null) {
              //use END time for coursework arrival, not the visual block start
              const leaveAt = calcLeaveTime(end, travelMins, bufferMins);

              const notifIds = await scheduleTravelNotifs(
              //notification to tell user to leave and cw on site alerts fire even if lecture paused
                c.title,
                leaveAt,
                travelMins,
                bufferMins,
                onSite
              );

              scheduledNotifIds.push(...notifIds);

              leaveMeta = `Leave at ${leaveAt.toLocaleTimeString([], {
              //building ui string for leave time
                hour: "2-digit",minute: "2-digit",
              })}`;

              const usedFallback = liveTravelMins == null;//whether fallback estimate was used

              //route summary text built
              routeMeta = `Route: Home -> ${location ?? currentDest} (${travelMins} mins${usedFallback ? " est." : ""})`;

            } else {
              routeMeta = "Set home address in preferences to get leave time";//cant calc travel
            }
          }

          const metaParts = [//metadata string undereach item
            `Module ${c.moduleId}${c.weighting != null ? ` • ${c.weighting}%` : ""}`,
            c.onSite ? "On-site" : "",leaveMeta,routeMeta,].filter(Boolean);

          return {//unified calender item
            key: `cw-${c.id}`,
            source: "coursework" as const,
            title: c.title,
            start,end,
            location,onSite: c.onSite,
            meta: metaParts.join(" • "),
          };
        })
      );

      await persistLeaveSoonNotifIds(scheduledNotifIds);//persists notf ids for timetable and cw

      const merged = [...timetableItems, ...courseworkItems].filter(//merge tt and cw in a week list
        (it) => it.start >= weekStart && it.start < weekEnd
        //only shows item in current week
      );

      merged.sort((a, b) => a.start.getTime() - b.start.getTime());//chronological order

      const byDay = new Map<string, UnifiedItem[]>();
      for (const it of merged) {
        const k = ymd(it.start);
        const arr = byDay.get(k) ?? [];//group by day
        arr.push(it);
        byDay.set(k, arr);
      }

    //map converted to secionlist
      const newSections = Array.from(byDay.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))//days ascending
        .map(([day, data]) => ({
          title: day,
          data,
        }));

      setSections(newSections);//ui updates

      const notifNote = scheduledNotifIds.length > 0 ? ` • ${scheduledNotifIds.length} alerts set` : "";
      setStatus(`loaded ${merged.length} items${notifNote}`);
      //travel source is not one val for whole screen, some are now live, others fallback

    } catch (e: any) {
      setStatus("load error");
      Alert.alert("Unified calendar error", String(e?.message ?? e));
    }
  }

  useEffect(() => {
  if (!prefsLoaded) return;
    loadUnifiedWeek();
  }, [prefsLoaded, weekStart.getTime()]);

  const [refreshing, setRefreshing] = useState(false);

  async function onPullToRefresh() {
    setRefreshing(true);
    await loadUnifiedWeek();
    setRefreshing(false);
  }

  const { scrollY, onScroll } = useScrollHeader();

  return (
    <SafeAreaView style={{flex:1, backgroundColor: AppColors.background}}>
      <ScreenHeader
        title="Timetable"
        subtitle={status}
        rightSlot={!isCurrentWeek ? <SecBtn title="Today" onPress={currentWeek} /> : undefined}
        scrollY={scrollY}
      />
          <View style={s.onSiteStrip}>
            <View style={{ flex: 1 }}>
              <Text style={s.onSiteLabel}>On site today</Text>
              <Text style={s.onSiteHint}>
                {onSiteMode
                  ? "Travel alerts paused for lectures and on-site submissions today; deadline reminers are unaffected!"
                  : "Toggle on if you're already at campus, pauses lecture travel alerts for today only"}
              </Text>
            </View>

            <Switch
              value={onSiteMode}
              onValueChange={handleOnSiteToggle}
              trackColor={{ false: AppColors.fill, true: AppColors.primary }}
              thumbColor="#fff"
            />
          </View>
          <GestureDetector gesture={weekSwipe}>
            <View collapsable={false} style={{ flex: 1 }}>
              <UnifiedWeekView
               weekStartLabel={ymd(weekStart)}
               weekEndLabel={ymd(addDays(weekStart, 6))}
               sections={sections}
               onOpenRouteDetails={openRouteDetails}
               refreshing={refreshing}
               onRefresh={onPullToRefresh}
               onScroll={onScroll}
               />
            </View>
          </GestureDetector>
            <Modal
              visible={routeModalVisible}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => {
                setRouteModalVisible(false);
                setSelectedRoute(null);
              }}
            >
              <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }}>
                <View style={s.sheetHandle} />
                <View style={{ padding: Spacing.xl }}>
                  <Text style={s.sheetTitle}>
                    Route details
                  </Text>

                  <Text style={s.sheetSubtitle}>
                    {selectedRouteTitle}
                  </Text>

                  {routeLoading ? (
                    <Text style={s.sheetBody}>Loading route...</Text>
                  ) : selectedRoute ? (
                    <>
                      {selectedRoute.summary ? (
                        <Text style={[s.sheetBody, { marginBottom: 12 }]}>
                          {selectedRoute.summary}
                        </Text>
                      ) : null}
                      {selectedRoute.durationSeconds != null ? (
                        <Text style={{ color: AppColors.textMuted, marginBottom: 12 }}>
                          Total travel time: {Math.ceil(selectedRoute.durationSeconds / 60)} mins
                        </Text>
                      ) : null}

                      <ScrollView style={{ maxHeight: 500 }}>
                        {selectedRoute.steps.map((step, i) => (
                          <View key={i} style={s.stepRow}>
                            <Text style={s.stepTitle}>
                              {i + 1}. {step.instruction}
                            </Text>
                            {step.durationSeconds != null ? (
                              <Text style={{ color: AppColors.textMuted, marginTop: 4 }}>
                                Duration: {Math.ceil(step.durationSeconds / 60)} mins
                              </Text>
                            ) : null}

                            {step.lineName ? (<Text style={s.stepHighlight}>Line: {step.lineName}</Text>) : null}

                            {step.vehicleType ? (<Text style={s.stepHighlight}>Vehicle: {step.vehicleType}</Text> ) : null}

                            {step.departureStop ? (<Text style={s.stepHighlight}>From: {step.departureStop}</Text> ) : null}

                            {step.arrivalStop ? (<Text style={s.stepHighlight}>To: {step.arrivalStop}</Text>) : null}

                            {step.headSign ? (<Text style={s.stepHighlight}>Direction: {step.headSign}</Text>) : null}
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  ) : (
                    <Text style={s.sheetBody}>
                      No route details loaded
                    </Text>
                  )}

                  <Pressable
                    onPress={() => {
                      setRouteModalVisible(false);
                      setSelectedRoute(null);
                    }}
                    style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={s.closeBtnText}>Close</Text>
                  </Pressable>
                </View>
              </SafeAreaView>
            </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  onSiteStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: AppColors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.separator,
  },
  onSiteLabel: {
    color: AppColors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  onSiteHint: {
    color: AppColors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.fill,
    marginTop: 8,
  },
  sheetTitle: { ...Type.title3, color: AppColors.text },
  sheetSubtitle: { color: AppColors.textSecondary, marginTop: 6 },
  sheetBody: { color: AppColors.textSecondary, marginTop: 16 },
  stepRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.separator,
  },
  stepTitle: { color: AppColors.text, fontWeight: "600" },
  stepHighlight: { color: AppColors.warning },
  closeBtn: { marginTop: 16, alignSelf: "flex-start" },
  closeBtnText: { color: AppColors.accent, fontSize: 16, fontWeight: "600" },
});
