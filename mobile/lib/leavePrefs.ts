import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "citysync.leaveBufferMins.v1";//storage key for user's preffered leave early buffer

export async function getLeaveBufferMins(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY);//gets buffer value from local storage
  const n = raw ? Number(raw) : NaN;//from str to num
  return Number.isFinite(n) ? n : 10; //default 10 mins
}

export async function setLeaveBufferMins(mins: number): Promise<void> {
//keeps user prefs for travel time buffer used in notifcations
  await AsyncStorage.setItem(KEY, String(mins));
}