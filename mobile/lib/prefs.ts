import { getString, setString, getJSON, setJSON, removeItem } from "@/lib/storage";
import { isTransitSubMode, isTravelMode, type TransitSubMode, type TravelMode } from "@/lib/types";

const CALENDAR_IDS_KEY = "citysync.selectedCalendarIds.v1";
const LEAVE_BUFFER_KEY = "citysync.leaveBufferMins.v1";
const HOME_LOCATION_KEY = "citysync.homeLocation.v1";
const ON_SITE_KEY = "citysync.onSiteToday.v1";

//travel mode is mirrored locally purely so the travel screen can render the right chip
//immediately on open, the backend preferences remain the source of truth
const TRAVEL_MODE_KEY = "citysync.travelMode.v1";
const TRANSIT_MODES_KEY = "citysync.transitModes.v1";

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

/**last travel mode the user picked
 * validated on read so a value from an older build can never reach the routes api*/
export async function getCachedTravelMode(): Promise<TravelMode> {
  const raw = await getString(TRAVEL_MODE_KEY);
  return isTravelMode(raw) ? raw : "TRANSIT";
}

export async function setCachedTravelMode(mode: TravelMode): Promise<void> {
  await setString(TRAVEL_MODE_KEY, mode);
}

export async function getCachedTransitModes(): Promise<TransitSubMode[]> {
  const parsed = await getJSON<unknown>(TRANSIT_MODES_KEY);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isTransitSubMode);
}

export async function setCachedTransitModes(modes: TransitSubMode[]): Promise<void> {
  await setJSON(TRANSIT_MODES_KEY, modes);
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
