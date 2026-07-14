import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";


function getApiBase(): string{
//func to determine backend url when running expo go

    const hostUri = Constants.expoConfig?.hostUri;//expo provides dev server address during expo start

    if(hostUri){
        const host = hostUri.split(":")[0];//to extract ip address

        return `http://${host}:8080`;//use the ip pointing to backend port for spring boot

    }

    return "http://localhost:8080";
}

export const API_BASE = getApiBase();

const AUTH_KEY = "citysync.userId.v1";

//eeturns headers for all authenticated API calls *reads userId from AsyncStorageand sends it as X-User-Id and is read to authenticate the req
export async function authHeaders(): Promise<Record<string, string>> {
  const userId = await AsyncStorage.getItem(AUTH_KEY);
  return {
    "Content-Type": "application/json",
    ...(userId ? { "X-User-Id": userId } : {}),
  };
}

/**returns the current userId from AsyncStorage
 * throws if not logged in*/
export async function getUserId(): Promise<number> {

  const val = await AsyncStorage.getItem(AUTH_KEY);
  if (!val) throw new Error("not authenticated");
  return Number(val);
}

export async function delUserId(){
//user id is deleted and sesh cleared
await AsyncStorage.removeItem(AUTH_KEY);
}