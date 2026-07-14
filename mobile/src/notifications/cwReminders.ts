import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,//how notifications look when received while app is actively open
  }),
 });

 const StorageKey = "cwNotif_Map";//key to keep mapping between coursework IDs and notification IDs

 type notifMap = Record<string,string[]>;

 //load notification mapping from storage
 async function getMap(): Promise<notifMap>{
    const raw = await AsyncStorage.getItem(StorageKey);
    return raw ? (JSON.parse(raw) as notifMap) : {};

 }

 async function setMap(map: notifMap): Promise<void>{
    await AsyncStorage.setItem(StorageKey, JSON.stringify(map));
 }

 //save same thing to storage
 export async function checkNotifPerms(): Promise<boolean>{
    const settings = await Notifications.getPermissionsAsync();
    if (

        settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL//allow if fully granted or prov
    ) {
        return true;
    }

    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;

 }
//parse due date string into date object n handles iso timestamps n date-only strings
function parseDueDate(dueDate: string): Date | null {
  if (!dueDate) return null;

  const isDateOnly = dueDate.length === 10 && dueDate[4] === "-" && dueDate[7] === "-" && !dueDate.includes("T");//format for YYYY-MM-DD

  if (isDateOnly) {//if date only, treat as end of the day 23:59
    const d = new Date(`${dueDate}T23:59:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  //else full ISO string
  const d = new Date(dueDate);
  return isNaN(d.getTime()) ? null : d;
}

function atMorningSameDay(d: Date, hour = 9): Date {//returns same calendar day at specified hour, default 9am
  const x = new Date(d);
  x.setHours(hour, 0, 0, 0);
  return x;
}

function minusMs(d: Date, ms: number): Date {//minus ms from a date
  return new Date(d.getTime() - ms);
}



function isFuture(d: Date): boolean {
  return d.getTime() > Date.now() + 5_000;//prevents scheduling past notifications, 5 second margin
}

//shape required to schedule reminders
export type CourseworkLike = {
  id: number;
  title: string;
  dueDate: string; //iso string or date only
  completed?: boolean;
};

export async function cancelCourseworkReminders(//cancels all scheduled reminders for specific coursework
  courseworkId: number
): Promise<void> {

  const map = await getMap();
  const key = String(courseworkId);
  const ids = map[key] ?? [];

  //attempt to cancel each scheduled notification
  await Promise.all(
    ids.map(async (id) => {

      try {

        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {

        //ignore if already cancelled/missing
      }

    })

  );

  delete map[key]; //deletes entry from map
  await setMap(map);
}

export async function scheduleCourseworkReminders(//schedule reminder notifications for a coursework item
  cw: CourseworkLike
): Promise<void> {


  if (cw.completed) { //if coursework completed, reminders removed
    await cancelCourseworkReminders(cw.id);
    return;
  }

  const ok = await checkNotifPerms();
  if (!ok) return;

  await cancelCourseworkReminders(cw.id);//clear old reminders before scheduling new ones

  const due = parseDueDate(cw.dueDate);
  if (!due) return;

  //reminder schedule system relative to due date
  const triggers: { when: Date; label: string }[] = [

    { when: minusMs(due, 7 * 24 * 60 * 60 * 1000), label: "Due in 7 days" },
    { when: minusMs(due, 3 * 24 * 60 * 60 * 1000), label: "Due in 3 days" },
    { when: atMorningSameDay(due, 9), label: "Due today!" },
    { when: minusMs(due, 3 * 60 * 60 * 1000), label: "Due in 3 hours!!" },
    { when: minusMs(due, 1 * 60 * 60 * 1000), label: "Due in an hour!!!" },
    //like a ocuntdown

  ].filter((t) => isFuture(t.when)); //only schedule future reminders

  const scheduledIds: string[] = [];

  for (const t of triggers) {//schedule each reminder with expo notifications

    const id = await Notifications.scheduleNotificationAsync({
      content: {

        title: "CitySync: Coursework reminder",
        body: `${cw.title} — ${t.label}`,
        data: { courseworkId: cw.id, dueDate: cw.dueDate },

      },

      trigger:{type:"date" as const, date : t.when,},
    });

    scheduledIds.push(id);
  }

  //persist scheduled notification IDs so they can be cancelled later
  const map = await getMap();

  map[String(cw.id)] = scheduledIds;
  await setMap(map);
}