//keeps user's saved home location
import AsyncStorage from "@react-native-async-storage/async-storage";

const HOME_KEY = "citysync.homeLocation.v1";//storage key for the hone location value thats unique for user


export async function getHomeLocation(): Promise<string> {//retrieves the saved home location from local storage
  const raw = await AsyncStorage.getItem(HOME_KEY);

  return raw?.trim() ? raw.trim() : "";//if a value exists and isn't whitespace, return trimmed version
  //^else return empty string to indicate not set
}

//stores the users home location to local storage
export async function setHomeLocation(value: string): Promise<void> {
  await AsyncStorage.setItem(HOME_KEY, value.trim());
}