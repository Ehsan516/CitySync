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

export type UserPrefDto = {
  homeAddress: string | null;
  UniLoc: string | null;
  bufferMins: number | null;
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
};

export type TravelDetails = {
  fallback: boolean;
  durationSeconds: number | null;
  summary: string | null;
  steps: RouteStepDto[];
};
