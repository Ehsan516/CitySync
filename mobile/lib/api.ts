import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type {
  CourseworkDto,
  ModuleDto,
  RouteOption,
  TransitRoutingPref,
  TransitSubMode,
  TravelDetails,
  TravelMode,
  TravelPlan,
  TravelPlanQuery,
  UserPrefDto,
} from "@/lib/types";

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

export class ApiError extends Error {
  status: number;
  bodyText: string;

  constructor(status: number, bodyText: string) {
    super(`Request failed (${status})`);
    this.status = status;
    this.bodyText = bodyText;
  }
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...(await authHeaders()),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, text);
  }

  return (text ? JSON.parse(text) : undefined) as T;
}

/**builds a query string, skipping anything null/undefined/blank
 * both endpoints get trimmed and encoded, the old hand rolled version only trimmed origin*/
function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    const str = String(value).trim();
    if (str === "") continue;

    parts.push(`${key}=${encodeURIComponent(str)}`);
  }

  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

function travelQuery(origin: string, destination: string, arrivalTime?: string): string {
  return buildQuery({ origin, destination, arrivalTime });
}

export const modulesApi = {
  list: (userId: number) => requestJson<ModuleDto[]>(`/users/${userId}/modules`),

  create: (userId: number, body: { code: string; name: string; credits: number | null }) =>
    requestJson<ModuleDto>(`/users/${userId}/modules`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (
    userId: number,
    moduleId: number,
    patch: Partial<{ code: string; name: string; credits: number | null }>
  ) =>
    requestJson<ModuleDto>(`/users/${userId}/modules/${moduleId}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  remove: (userId: number, moduleId: number) =>
    requestJson<void>(`/users/${userId}/modules/${moduleId}`, { method: "DELETE" }),
};

export const courseworkApi = {
  listAll: (userId: number) => requestJson<CourseworkDto[]>(`/users/${userId}/coursework`),

  create: (
    userId: number,
    moduleId: number,
    body: { title: string; dueDate: string; weighting: number | null; onSite: boolean; location: string | null }
  ) =>
    requestJson<CourseworkDto>(`/users/${userId}/modules/${moduleId}/coursework`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (
    userId: number,
    moduleId: number,
    courseworkId: number,
    patch: Partial<{
      title: string;
      dueDate: string;
      weighting: number | null;
      completed: boolean;
      scorePercent: number | null;
      onSite: boolean;
      location: string | null;
    }>
  ) =>
    requestJson<CourseworkDto>(`/users/${userId}/modules/${moduleId}/coursework/${courseworkId}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  remove: (userId: number, moduleId: number, courseworkId: number) =>
    requestJson<void>(`/users/${userId}/modules/${moduleId}/coursework/${courseworkId}`, {
      method: "DELETE",
    }),
};

export const preferencesApi = {
  get: (userId: number) => requestJson<UserPrefDto>(`/users/${userId}/preferences`),

  update: (
    userId: number,
    body: {
      homeAddress: string;
      UniLoc: string;
      bufferMins: number;

      //travel prefs, optional so existing callers don't have to pass them
      preferredMode?: TravelMode;
      transitModes?: TransitSubMode[];
      transitRoutingPref?: TransitRoutingPref | null;
      returnBufferMins?: number;
    }
  ) =>
    requestJson<UserPrefDto>(`/users/${userId}/preferences`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

export const travelApi = {
  //calls backend /travel which proxies to google routes and returns seconds + fallback flag
  async getDurationMinutes(origin: string, destination: string, arrivalTime?: string): Promise<number | null> {
    if (!origin || origin.trim() === "") return null;

    try {
      const json = await requestJson<{ seconds: number; fallback: boolean }>(
        `/travel${travelQuery(origin, destination, arrivalTime)}`
      );

      //if backend says fallback=true, it couldn't reach google -> null so local estimate is used
      if (json.fallback || json.seconds <= 0) return null;

      return Math.ceil(json.seconds / 60); // seconds -> mins (round up so you don't underestimate)
    } catch {
      return null;
    }
  },

  //calls backend to get full route details
  async getDetails(origin: string, destination: string, arrivalTime?: string): Promise<TravelDetails | null> {
    if (!origin || origin.trim() === "") return null;

    try {
      const json = await requestJson<TravelDetails>(`/travel/details${travelQuery(origin, destination, arrivalTime)}`);

      if (json.fallback) return null;

      return json;
    } catch {
      return null;
    }
  },

  /**full journey plan with several options, this is what the departure board renders
   *
   * unlike the older helpers this throws instead of swallowing errors, the travel screen needs
   * to tell the user "couldn't refresh" rather than silently showing a stale board
   */
  getPlan(query: TravelPlanQuery, signal?: AbortSignal): Promise<TravelPlan> {
    const qs = buildQuery({
      origin: query.origin,
      destination: query.destination,
      mode: query.mode,
      departureTime: query.departureTime,
      arrivalTime: query.arrivalTime,
      transitModes: query.transitModes?.length ? query.transitModes.join(",") : null,
      transitRoutingPref: query.transitRoutingPref,
      alternatives: query.alternatives ?? true,
    });

    return requestJson<TravelPlan>(`/travel/plan${qs}`, { signal });
  },

  /**last service of the day that still gets the user home
   * backend answers 204 when nothing is left, which requestJson surfaces as undefined*/
  async getLastService(
    origin: string,
    destination: string,
    mode: TravelMode = "TRANSIT",
    transitModes?: TransitSubMode[] | null,
    transitRoutingPref?: TransitRoutingPref | null,
    signal?: AbortSignal
  ): Promise<RouteOption | null> {
    const qs = buildQuery({
      origin,
      destination,
      mode,
      transitModes: transitModes?.length ? transitModes.join(",") : null,
      transitRoutingPref,
    });

    try {
      const json = await requestJson<RouteOption | undefined>(`/travel/last-service${qs}`, { signal });
      return json ?? null;
    } catch {
      //a missing last-service is never worth blocking the screen over
      return null;
    }
  },
};

export const accountApi = {
  requestDeleteCode: (userId: number) =>
    requestJson<{ message: string }>(`/users/${userId}/delete-account/request-code`, { method: "POST" }),

  deleteAccount: (userId: number, code: string) =>
    requestJson<{ message: string }>(`/users/${userId}`, {
      method: "DELETE",
      body: JSON.stringify({ code }),
    }),
};

export const authApi = {
  requestCode: (email: string) =>
    requestJson<{ message: string }>(`/auth/request-code`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyCode: (email: string, code: string) =>
    requestJson<{ userId: number }>(`/auth/verify-code`, {
      method: "POST",
      body: JSON.stringify({ email, code }),
    }),
};
