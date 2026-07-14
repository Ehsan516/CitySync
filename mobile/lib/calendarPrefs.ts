import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "citysync.selectedCalendarIds.v1";//storage key for selec calendars for unified calendar view

export async function getSelectedCalendarIds(): Promise<string[] | null> {
  //gets stored calendar IDs as json str
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;//no saved selection
  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : null;
    //must be array of strings for calendar ID
  } catch {
    return null;//if stored data is corrupted/invalid json
  }
}

export async function setSelectedCalendarIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  //persists selected calendar ids for timetable
}

export async function clearSelectedCalendarIds(): Promise<void> {//celars calendar select
  await AsyncStorage.removeItem(KEY);
}