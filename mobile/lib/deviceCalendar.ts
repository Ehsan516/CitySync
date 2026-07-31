import * as Calendar from "expo-calendar";
import { getSelectedCalendarIds } from "@/lib/prefs";

export type CalendarLoad = {
  granted: boolean;
  events: Calendar.Event[];
  calendars: Calendar.Calendar[];
  note: string;
};

export async function requestCalendarAccess(): Promise<boolean> {
  const perm = await Calendar.requestCalendarPermissionsAsync();
  return perm.status === "granted";
}

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

  if (stillThere.length === 0) {
    return {
      ids: calendars.map((c) => c.id),
      note: "saved calendars unavailable, using all calendars...",
    };
  }

  return { ids: stillThere, note: `using ${stillThere.length} selected calendar(s)...` };
}

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

export async function getLastEventEndToday(): Promise<Date | null> {
  try {
    const { granted, events } = await loadEventsBetween(startOfToday(), endOfToday());
    if (!granted || events.length === 0) return null;

    const now = Date.now();

    const upcomingEnds = events
      .map((e) => new Date(e.endDate))
      .filter((end) => !Number.isNaN(end.getTime()) && end.getTime() > now)
      .sort((a, b) => b.getTime() - a.getTime());

    return upcomingEnds[0] ?? null;
  } catch {
    return null;
  }
}
