export type ModuleDto = {
  id: number;
  userId: number;
  code: string;
  name: string;
  credits: number | null;
};

export type CourseworkDto = {
  id: number;
  moduleId: number;
  userId: number;
  title: string;
  dueDate: string;
  weighting: number | null;
  completed?: boolean;
  completedAt?: string | null;
  scorePercent?: number | null;
  onSite?: boolean;
  location?: string | null;
};

export type TravelMode = "TRANSIT" | "DRIVE" | "WALK" | "BICYCLE" | "TWO_WHEELER";

export type TransitSubMode = "BUS" | "SUBWAY" | "TRAIN" | "LIGHT_RAIL" | "RAIL";

export type TransitRoutingPref = "LESS_WALKING" | "FEWER_TRANSFERS";

export const TRAVEL_MODES: TravelMode[] = ["TRANSIT", "DRIVE", "WALK", "BICYCLE", "TWO_WHEELER"];

export const TRANSIT_SUB_MODES: TransitSubMode[] = ["TRAIN", "SUBWAY", "BUS", "LIGHT_RAIL", "RAIL"];

export function isTravelMode(value: unknown): value is TravelMode {
  return typeof value === "string" && (TRAVEL_MODES as string[]).includes(value);
}

export function isTransitSubMode(value: unknown): value is TransitSubMode {
  return typeof value === "string" && (TRANSIT_SUB_MODES as string[]).includes(value);
}

export type UserPrefDto = {
  homeAddress: string | null;
  UniLoc: string | null;
  bufferMins: number | null;

  preferredMode?: TravelMode | null;
  transitModes?: TransitSubMode[] | null;
  transitRoutingPref?: TransitRoutingPref | null;
  returnBufferMins?: number | null;
};

export type UnifiedItem = {
  key: string;
  source: "timetable" | "coursework";
  title: string;
  start: Date;
  end: Date;
  location?: string;
  meta?: string;
  onSite?: boolean;
};

export type RouteStepDto = {
  mode: string;
  instruction: string;
  durationSeconds: number | null;
  departureStop: string | null;
  arrivalStop: string | null;
  lineName: string | null;
  vehicleType: string | null;
  headSign: string | null;

  departureTime: string | null;
  arrivalTime: string | null;
  stopCount: number | null;
  lineColor: string | null;
  lineTextColor: string | null;
  agencyName: string | null;
};

export type TravelDetails = {
  fallback: boolean;
  durationSeconds: number | null;
  summary: string | null;
  steps: RouteStepDto[];
};

export type RouteOption = {
  optionIndex: number;
  durationSeconds: number | null;
  summary: string | null;

  departureTime: string | null;
  arrivalTime: string | null;

  transferCount: number | null;
  walkingSeconds: number | null;
  steps: RouteStepDto[];
};

export type TravelPlan = {
  fallback: boolean;
  mode: TravelMode;
  arriveBy: boolean;

  requestedTime: string | null;
  computedAt: string;

  options: RouteOption[];
  notice: string | null;
};

export type TravelPlanQuery = {
  origin: string;
  destination: string;
  mode: TravelMode;

  departureTime?: string | null;
  arrivalTime?: string | null;

  transitModes?: TransitSubMode[] | null;
  transitRoutingPref?: TransitRoutingPref | null;
  alternatives?: boolean;
};
