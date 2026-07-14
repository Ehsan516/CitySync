import React, { useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, Text, View, Modal, Pressable,ScrollView, StyleSheet, Switch } from "react-native";
import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";


import { getSelectedCalendarIds } from "@/lib/calendarPrefs";
import { getUserId, authHeaders, API_BASE } from "@/lib/api";
import UnifiedWeekView from "@/components/calendar/UnifiedWeekView";
import {getOnSiteToday, setOnSiteToday} from "@/lib/onSitePrefs";

const CityCampDest = "City St George's, University of London, Northampton Square, London EC1V 0HB";

//stores leave notification ids so we can cancel them on reload
const leavenotif = "citysync.leaveSoonNotifIds.v1";

const getReadyMins=20; //20 min buffer before leave time

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type CourseworkDto = {
  id: number;
  moduleId: number;
  userId: number;
  title: string;
  dueDate: string;
  weighting: number | null;
  onSite: boolean;
  location: string | null;
};
type UnifiedItem = {
//calendar or coursework items on cal view
  key: string;
  source: "timetable" | "coursework";
  title: string;
  start: Date;
  end: Date;
  location?: string;
  meta?: string;
  onSite?: boolean;
};


type UserPrefDto ={
    homeAddress: string | null;
    UniLoc: string | null;
    bufferMins: number | null;
    //same json user preferences for home loc, uni loc and time buffer for backend
}

type routeStepDto = {
    mode: string; instruction: string; durationSeconds: number | null;
    departureStop: string | null; arrivalStop: string | null; lineName: string | null;
    vehicleType: string | null; headSign: string | null;
};//one step in jounrey

type travelDeets = {fallback: boolean; durationSeconds: number | null; summary: string | null; steps: routeStepDto[];};
//full journey from backend

function startOfWeek(d: Date) {
  //monday-start week
  const x = new Date(d);
  const day = x.getDay(); // 0 sun and 6 is sat
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseCwDate(dateTimeString: string) {
    return new Date(dateTimeString);
    //full iso string for cw items for calendar view
}

async function fetchTravelMins(home: string, destination: string, arrivalTime?: string): Promise<number | null> {
  //calls backend /travel which proxies to google routes and returns seconds + fallback flag
  if (!home || home.trim() === "") return null;

  try {

    const url =
      `${API_BASE}/travel` +
      `?origin=${encodeURIComponent(home.trim())}` + //encode so spaces/postcodes work in a URL
      `&destination=${encodeURIComponent(destination)}`+//spaces in location/postcode don't break url
      (arrivalTime ? `&arrivalTime=${encodeURIComponent(arrivalTime)}`:"");

    const res = await fetch(url, {
      headers: await authHeaders(),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { seconds: number; fallback: boolean };

    //if backend says fallback=true, it couldn't reach google -> return null so our local estimator is used
    if (json.fallback || json.seconds <= 0) return null;

    return Math.ceil(json.seconds / 60); // seconds -> mins (round up so you don't underestimate)
  } catch {

    return null;
  }
}

async function fetchTravelDetails(
//calls backend to get full route details
  home: string,
  destination: string,
  arrivalTime?: string
): Promise<travelDeets | null> {
  if (!home || home.trim() === "") return null;//can't compute route if no home address

  try {//url qith query params
    const url =
      `${API_BASE}/travel/details` +
      `?origin=${encodeURIComponent(home.trim())}` +//encode because url break gave me error
      `&destination=${encodeURIComponent(destination)}` +
      (arrivalTime ? `&arrivalTime=${encodeURIComponent(arrivalTime)}` : "");

    const res = await fetch(url, {
    //call backend with auth headers
      headers: await authHeaders(),
    });

    if (!res.ok) return null;//null if reqfails

    const json = (await res.json()) as travelDeets;//json parsed

    if (json.fallback) return null;
    //null if no real route way

    return json;
  } catch {
    return null;
    //any other errors like netwrok
  }
}

function estimateMinsHomeUnifb(home: string) {
  if (!home || home.trim() === "") return null;

  /**for now until GMatrix so if they only postcode, assume 45 mins
    else full address = 50 mins*/
  const looksLikePostcode = home.length <= 10;
  return looksLikePostcode ? 45 : 50;
}

function calcLeaveTime(eventStart: Date, travelMins: number, bufferMins: number) {
  const ms = (travelMins + bufferMins) * 60_000;
  return new Date(eventStart.getTime() - ms);
}

async function cancelAllLeaveSoonNotifs() {
  //cancel all previous leave-soon notifications so we don't stack duplicates on every reload
  try {

    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");

    const raw = await AsyncStorage.getItem(leavenotif);
    if (!raw) return;

    const ids = JSON.parse(raw) as string[];

    await Promise.all(
      ids.map(async (id) => {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
          //ignore if already cancelled/expired
        }
      })
    );

    await AsyncStorage.removeItem(leavenotif);

  } catch {
    //ignore storage errors
  }
}

async function ensureNotifPerms(): Promise<boolean>{
    let perms = await Notifications.getPermissionsAsync();
        if (!perms.granted){
        perms = await Notifications.requestPermissionsAsync();}

        return perms.granted;
}

async function scheduleTravelNotifs(
    eventTitle: string,
    leaveAt: Date,
    travelMins: number,
    bufferMins: number,
    skip: boolean

): Promise<string[]>{
    if (skip) return [];

    const granted = await ensureNotifPerms();
    if(!granted) return [];

    const ids: string[]=[];
    const now = Date.now();

    const getReadyAt = new Date(leaveAt.getTime()- getReadyMins * 60_000);
    //fires before leave time

    if(getReadyAt.getTime() > now){
        try{const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: "CitySync: Get Ready!",body:`leave for "${eventTitle}" in ${getReadyMins} minutes, get ready now.`,
                data: {type: "get_ready", eventTitle},
            },trigger:{
                type: "date" as const, date: getReadyAt,
            },
            });

            ids.push(id);
            console.log(`CitySync get ready notf for "${eventTitle}" at ${getReadyAt.toISOString()}`);
            }catch(e){
                console.log(`[CitySync] get ready schedule failed:`, e);
            }//for debug
        }

    if (leaveAt.getTime() > now) {
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "CitySync: Time to leave!",
            body: `Leave now for "${eventTitle}" — ${travelMins} min journey + ${bufferMins} min buffer`,
            data: { type: "leave_soon", eventTitle },
          },
          trigger: {type: "date" as const,date: leaveAt,},
        });

        ids.push(id);
        console.log(`[CitySync] leave notif for "${eventTitle}" at ${leaveAt.toISOString()}`);
      } catch (e) {
        console.log(`[CitySync] leave schedule failed:`, e)}
    }//debugging again

    return ids;
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

  const[selectedRoute,setSelectedRoute] = useState<travelDeets | null>(null);
  const[selectedRouteTitle,setSelectedRouteTitle] = useState("");
  //stores selected route and event title

  function nextWeek(){//func so user can see next week
    setWeekAnch((prev) => addDays(prev, 7));
  }

  function currentWeek(){
    setWeekAnch(new Date());//goes back to current week
  }

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

        const res = await fetch(`${API_BASE}/users/${USER_ID}/preferences`,{
            headers: await authHeaders(),
            //calls backend and gets the jwt
        });
        if (!res.ok){ return;}//skips if req fails

        const prefs = (await res.json()) as UserPrefDto;
        //prefs ack to ts object form json

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

       const details = await fetchTravelDetails(//func to fetch route details form backend
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

      const prefsRes = await fetch(`${API_BASE}/users/${USER_ID}/preferences`, {
        headers: await authHeaders(),//fetching user perfs and using authtoken to allow it
      });

      let currentBuffer = 10;
      let currentHome = "";
      let currentDest = CityCampDest;
      //temp prefs in case api fails^

      if (prefsRes.ok) {
        const prefs = (await prefsRes.json()) as UserPrefDto;
        ///response to userpref dto using await for async parse

        currentBuffer = prefs.bufferMins ?? 10;
        currentHome = prefs.homeAddress ?? "";
        currentDest = prefs.UniLoc?.trim() || CityCampDest;
        //prefs are used if exists else default vals

        setBuffer(currentBuffer);
        setHomeLocationState(currentHome);
        setDestination(currentDest);
        //react state updates for ui
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

      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");

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

          const liveTravelMins = await fetchTravelMins(currentHome,currentDest, eventArrivalTime);
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

          // const calMeta = e.calendarId ? `Calendar: ${e.calendarId}` : "";

          }
          const calName = calendars.find((c) => c.id === e.calendarId)?.title ?? e.calendarId;
          const calMeta = calName ? `Calendar ${calName}` : "";
          //^shows which selected calendar the event came from

          const meta = [leaveMeta, routeMeta, calMeta].filter(Boolean).join(" • ") || undefined;

          return {key: `tt-${e.id}`,source: "timetable", title: e.title ?? "(no title)",start,end,location,meta,};
        })
      );


//       const scheduled = await Notifications.getAllScheduledNotificationsAsync();
//       console.log("[CitySync] All scheduled:", JSON.stringify(scheduled, null, 2));

      setStatus("loading coursework from backend...");
      const cwRes = await fetch(`${API_BASE}/users/${USER_ID}/coursework`, {
        headers: await authHeaders(),
      });
      if (!cwRes.ok) {
        const txt = await cwRes.text();
        Alert.alert("Coursework load failed", `${cwRes.status}\n${txt}`);
        setStatus(`coursework load failed ${cwRes.status}`);
        return;
      }
      const coursework = (await cwRes.json()) as CourseworkDto[];

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

            const liveTravelMins = await fetchTravelMins(//getting live travel time from backend
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
            source: "coursework",
            title: c.title,
            start,end,
            location,onSite: c.onSite,
            meta: metaParts.join(" • "),
          };
        })
      );

      if (scheduledNotifIds.length > 0) {//persists notf ids for timetable and cw
        await AsyncStorage.setItem(leavenotif, JSON.stringify(scheduledNotifIds));
      }

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

  return (
    <SafeAreaView style={{flex:1, backgroundColor: "#0b0b0f"}}>
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
              trackColor={{ false: "#2a2a3a", true: "#ffffff" }}
              thumbColor="#fff"
            />
          </View>
            <UnifiedWeekView
             weekStartLabel={ymd(weekStart)}
             weekEndLabel={ymd(addDays(weekStart, 6))}
             status={status}
             sections={sections}
             onCurrentWeek={currentWeek}
             onNextWeek={nextWeek}
             onReload={loadUnifiedWeek}
             onOpenRouteDetails={openRouteDetails}
             />
            <Modal
              visible={routeModalVisible}
              animationType="slide"
              transparent={false}
              onRequestClose={() => {
                setRouteModalVisible(false);
                setSelectedRoute(null);
              }}
            >
              <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0f" }}>
                <View style={{ padding: 16 }}>
                  <Text style={{ fontSize: 20, fontWeight: "600", color: "white" }}>
                    Route details
                  </Text>

                  <Text style={{ color: "#d6d6df", marginTop: 6 }}>
                    {selectedRouteTitle}
                  </Text>

                  {routeLoading ? (
                    <Text style={{ color: "#d6d6df", marginTop: 16 }}>Loading route...</Text>
                  ) : selectedRoute ? (
                    <>
                      {selectedRoute.summary ? (
                        <Text style={{ color: "#d6d6df", marginTop: 16, marginBottom: 12 }}>
                          {selectedRoute.summary}
                        </Text>
                      ) : null}
                      {selectedRoute.durationSeconds != null ? (
                        <Text style={{ color: "#a9a9b6", marginBottom: 12 }}>
                          Total travel time: {Math.ceil(selectedRoute.durationSeconds / 60)} mins
                        </Text>
                      ) : null}

                      <ScrollView style={{ maxHeight: 500 }}>
                        {selectedRoute.steps.map((step, i) => (
                          <View
                            key={i}
                            style={{
                              paddingVertical: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: "#262638",
                            }}
                          >
                            <Text style={{ color: "white", fontWeight: "600" }}>
                              {i + 1}. {step.instruction}
                            </Text>
                            {step.durationSeconds != null ? (
                              <Text style={{ color: "#a9a9b6", marginTop: 4 }}>
                                Duration: {Math.ceil(step.durationSeconds / 60)} mins
                              </Text>
                            ) : null}

                            {step.lineName ? (<Text style={{ color: "#FFCD00" }}>Line: {step.lineName}</Text>) : null}

                            {step.vehicleType ? (<Text style={{ color: "#FFCD00" }}>Vehicle: {step.vehicleType}</Text> ) : null}

                            {step.departureStop ? (<Text style={{ color: "#FFCD00" }}>From: {step.departureStop}</Text> ) : null}

                            {step.arrivalStop ? (<Text style={{ color: "#FFCD00" }}>To: {step.arrivalStop}</Text>) : null}

                            {step.headSign ? (<Text style={{ color: "#FFCD00" }}>Direction: {step.headSign}</Text>) : null}
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  ) : (
                    <Text style={{ color: "#d6d6df", marginTop: 16 }}>
                      No route details loaded
                    </Text>
                  )}

                  <Pressable
                    onPress={() => {
                      setRouteModalVisible(false);
                      setSelectedRoute(null);
                    }}
                    style={{ marginTop: 16 }}
                  >
                    <Text style={{ color: "#60A5FA", fontSize: 16 }}>Close</Text>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#13131f",
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e30",
  },
  onSiteLabel: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  onSiteHint: {
    color: "#8888aa",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});