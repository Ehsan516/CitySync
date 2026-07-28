import * as Calendar from "expo-calendar";
import { getSelectedCalendarIds } from "@/lib/prefs";

/**shared device calendar access
 *
 * this used to live inline in the timetable screen, but the travel planner needs the same
 * "which calendars did the user pick, and what's on today" logic to work out when they're
 * heading home, so it lives here instead of being copy pasted with subtly different fallbacks
 */

export type CalendarLoad = {
  granted: boolean;//false means the user declined the permission prompt
  events: Calendar.Event[];
  calendars: Calendar.Calendar[];
  //human readable note about which calendars were used, screens surface this as status text
  note: string;
};

export async function requestCalendarAccess(): Promise<boolean> {
  const perm = await Calendar.requestCalendarPermissionsAsync();
  return perm.status === "granted";
}

/**resolves the calendar ids to read from
 * falls back to every calendar on the device when the user hasn't chosen, or when their
 * saved choices have since been deleted off the device*/
export async function resolveCalendarIds(
  calendars: Calendar.Calendar[]
): Promise<{ ids: string[]; note: string }> {
  const savedIds = await getSelectedCalendarIds();

  if (!savedIds || savedIds.length === 0) {
    return {
      ids: calendars.map((c) => c.id),
      note: "no calendars selected — using all. Pick calendars in the Cal. Source tab.",
    };
  }

  const existingIds = new Set(calendars.map((c) => c.id));
  const stillThere = savedIds.filter((id) => existingIds.has(id));
  //^keeps only saved calendars that still exist on the device

  if (stillThere.length === 0) {
    return {
      ids: calendars.map((c) => c.id),
      note: "saved calendars unavailable, using all calendars...",
    };
  }

  return { ids: stillThere, note: `using ${stillThere.length} selected calendar(s)...` };
}

/**loads events between two dates from the user's chosen calendars*/
export async function loadEventsBetween(start: Date, end: Date): Promise<CalendarLoad> {
  const granted = await requestCalendarAccess();
  if (!granted) {
    return { granted: false, events: [], calendars: [], note: "calendar permission denied" };
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const { ids, note } = await resolveCalendarIds(calendars);

  if (ids.length === 0) {
    return { granted: true, events: [], calendars, note: "no calendars on this device" };
  }

  const events = await Calendar.getEventsAsync(ids, start, end);

  return { granted: true, events, calendars, note };
}

//local day bounds, used for "what am I doing today"
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/**when the user is likely finished on campus today
 *
 * used to default the return journey's departure time. picks the end of the last event that
 * hasn't already finished, so a mid afternoon check still targets the evening lecture rather
 * than a lecture that ended this morning. null means nothing left today
 */
export async function getLastEventEndToday(): Promise<Date | null> {
  try {
    const { granted, events } = await loadEventsBetween(startOfToday(), endOfToday());
    if (!granted || events.length === 0) return null;

    const now = Date.now();

    const upcomingEnds = events
      .map((e) => new Date(e.endDate))
      .filter((end) => !Number.isNaN(end.getTime()) && end.getTime() > now)
      .sort((a, b) => b.getTime() - a.getTime());//latest first

    return upcomingEnds[0] ?? null;
  } catch {
    //travel planning must still work without calendar access
    return null;
  }
}
