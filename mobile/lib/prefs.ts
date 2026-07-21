import { getString, setString, getJSON, setJSON, removeItem } from "@/lib/storage";

const CALENDAR_IDS_KEY = "citysync.selectedCalendarIds.v1";
const LEAVE_BUFFER_KEY = "citysync.leaveBufferMins.v1";
const HOME_LOCATION_KEY = "citysync.homeLocation.v1";
const ON_SITE_KEY = "citysync.onSiteToday.v1";

export async function getSelectedCalendarIds(): Promise<string[] | null> {
  const parsed = await getJSON<unknown>(CALENDAR_IDS_KEY);
  if (!Array.isArray(parsed)) return null;

  return parsed.filter((x) => typeof x === "string");
}

export async function setSelectedCalendarIds(ids: string[]): Promise<void> {
  await setJSON(CALENDAR_IDS_KEY, ids);
}

export async function clearSelectedCalendarIds(): Promise<void> {
  await removeItem(CALENDAR_IDS_KEY);
}

export async function getLeaveBufferMins(): Promise<number> {
  const raw = await getString(LEAVE_BUFFER_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 10;
}

export async function setLeaveBufferMins(mins: number): Promise<void> {
  await setString(LEAVE_BUFFER_KEY, String(mins));
}

export async function getHomeLocation(): Promise<string> {
  const raw = await getString(HOME_LOCATION_KEY);
  return raw?.trim() ? raw.trim() : "";
}

export async function setHomeLocation(value: string): Promise<void> {
  await setString(HOME_LOCATION_KEY, value.trim());
}

function todayYmd(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export async function getOnSiteToday(): Promise<boolean> {
  const parsed = await getJSON<{ date: string; onSite: boolean }>(ON_SITE_KEY);
  if (!parsed || parsed.date !== todayYmd()) return false;
  return parsed.onSite;
}

export async function setOnSiteToday(onSite: boolean): Promise<void> {
  await setJSON(ON_SITE_KEY, { date: todayYmd(), onSite });
}
