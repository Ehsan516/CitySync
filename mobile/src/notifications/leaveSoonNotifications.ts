import * as Notifications from "expo-notifications";
import { getJSON, setJSON, removeItem } from "@/lib/storage";
import { checkNotifPerms } from "@/src/notifications/notificationSetup";

//stores leave notification ids so we can cancel them on reload
const LEAVE_NOTIF_IDS_KEY = "citysync.leaveSoonNotifIds.v1";

const GET_READY_MINS = 20; //20 min buffer before leave time

export function estimateMinsHomeUnifb(home: string) {
  if (!home || home.trim() === "") return null;

  /**for now until GMatrix so if they only postcode, assume 45 mins
    else full address = 50 mins*/
  const looksLikePostcode = home.length <= 10;
  return looksLikePostcode ? 45 : 50;
}

export function calcLeaveTime(eventStart: Date, travelMins: number, bufferMins: number) {
  const ms = (travelMins + bufferMins) * 60_000;
  return new Date(eventStart.getTime() - ms);
}

export async function cancelAllLeaveSoonNotifs() {
  //cancel all previous leave-soon notifications so we don't stack duplicates on every reload
  try {
    const ids = await getJSON<string[]>(LEAVE_NOTIF_IDS_KEY);
    if (!ids) return;

    await Promise.all(
      ids.map(async (id) => {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
          //ignore if already cancelled/expired
        }
      })
    );

    await removeItem(LEAVE_NOTIF_IDS_KEY);
  } catch {
    //ignore storage errors
  }
}

export async function persistLeaveSoonNotifIds(ids: string[]) {
  if (ids.length > 0) {
    await setJSON(LEAVE_NOTIF_IDS_KEY, ids);
  }
}

export async function scheduleTravelNotifs(
  eventTitle: string,
  leaveAt: Date,
  travelMins: number,
  bufferMins: number,
  skip: boolean
): Promise<string[]> {
  if (skip) return [];

  const granted = await checkNotifPerms();
  if (!granted) return [];

  const ids: string[] = [];
  const now = Date.now();

  const getReadyAt = new Date(leaveAt.getTime() - GET_READY_MINS * 60_000);
  //fires before leave time

  if (getReadyAt.getTime() > now) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "CitySync: Get Ready!",
          body: `leave for "${eventTitle}" in ${GET_READY_MINS} minutes, get ready now.`,
          data: { type: "get_ready", eventTitle },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: getReadyAt },
      });

      ids.push(id);
      console.log(`CitySync get ready notf for "${eventTitle}" at ${getReadyAt.toISOString()}`);
    } catch (e) {
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
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: leaveAt },
      });

      ids.push(id);
      console.log(`[CitySync] leave notif for "${eventTitle}" at ${leaveAt.toISOString()}`);
    } catch (e) {
      console.log(`[CitySync] leave schedule failed:`, e);
    }//debugging again
  }

  return ids;
}
