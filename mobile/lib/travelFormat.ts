import type { RouteOption, TransitSubMode, TravelMode } from "@/lib/types";

export const MODE_LABELS: Record<TravelMode, string> = {
  TRANSIT: "Transit",
  DRIVE: "Drive",
  WALK: "Walk",
  BICYCLE: "Cycle",
  TWO_WHEELER: "Moped",
};

export const TRANSIT_SUB_MODE_LABELS: Record<TransitSubMode, string> = {
  TRAIN: "Train",
  SUBWAY: "Tube",
  BUS: "Bus",
  LIGHT_RAIL: "Tram/DLR",
  RAIL: "All rail",
};

const VEHICLE_LABELS: Record<string, string> = {
  BUS: "Bus",
  RAIL: "Train",
  HEAVY_RAIL: "Train",
  COMMUTER_TRAIN: "Train",
  HIGH_SPEED_TRAIN: "Train",
  LONG_DISTANCE_TRAIN: "Train",
  METRO_RAIL: "Tube",
  SUBWAY: "Tube",
  MONORAIL: "Monorail",
  TRAM: "Tram",
  LIGHT_RAIL: "Light rail",
  FERRY: "Ferry",
  CABLE_CAR: "Cable car",
  FUNICULAR: "Funicular",
  GONDOLA_LIFT: "Cable car",
  TROLLEYBUS: "Trolleybus",
  SHARE_TAXI: "Share taxi",
  INTERCITY_BUS: "Coach",
  OTHER: "Transit",
};

export function vehicleLabel(vehicleType: string | null): string | null {
  if (!vehicleType) return null;
  return VEHICLE_LABELS[vehicleType.toUpperCase()] ?? vehicleType;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";

  const totalMins = Math.max(1, Math.round(seconds / 60));

  if (totalMins < 60) return `${totalMins} min`;

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function parseIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatCountdown(iso: string | null | undefined, now: number): string | null {
  const target = parseIso(iso);
  if (!target) return null;

  const diffMs = target.getTime() - now;
  const diffMins = Math.round(diffMs / 60_000);

  if (diffMins < -1) return `left ${Math.abs(diffMins)} min ago`;
  if (diffMins <= 0) return "leaving now";
  if (diffMins === 1) return "in 1 min";
  if (diffMins < 60) return `in ${diffMins} min`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  return mins === 0 ? `in ${hours}h` : `in ${hours}h ${mins}m`;
}

export function hasDeparted(option: RouteOption, now: number): boolean {
  const dep = parseIso(option.departureTime);
  if (!dep) return false;

  return dep.getTime() < now - 60_000;
}

export type ArrivalVerdict =
  | { kind: "none" }
  | { kind: "unknown" }
  | { kind: "onTime"; sparesMins: number }
  | { kind: "tight"; sparesMins: number }
  | { kind: "late"; lateMins: number };

const TIGHT_THRESHOLD_MINS = 10;

export function arrivalVerdict(option: RouteOption, deadline: Date | null): ArrivalVerdict {
  if (!deadline) return { kind: "none" };

  const arrival = parseIso(option.arrivalTime);
  if (!arrival) return { kind: "unknown" };

  const spareMs = deadline.getTime() - arrival.getTime();
  const spareMins = Math.round(spareMs / 60_000);

  if (spareMins < 0) return { kind: "late", lateMins: Math.abs(spareMins) };
  if (spareMins <= TIGHT_THRESHOLD_MINS) return { kind: "tight", sparesMins: spareMins };

  return { kind: "onTime", sparesMins: spareMins };
}

export function verdictLabel(verdict: ArrivalVerdict): string | null {
  switch (verdict.kind) {
    case "onTime":
      return `${verdict.sparesMins} min spare`;
    case "tight":
      return verdict.sparesMins <= 0 ? "only just" : `tight · ${verdict.sparesMins} min spare`;
    case "late":
      return `${verdict.lateMins} min late`;
    default:
      return null;
  }
}

export function formatTransfers(transferCount: number | null | undefined): string | null {
  if (transferCount == null) return null;
  if (transferCount <= 0) return "direct";

  return transferCount === 1 ? "1 change" : `${transferCount} changes`;
}

export function recommendedOptionIndex(
  options: RouteOption[],
  deadline: Date | null,
  now: number
): number {
  if (options.length === 0) return -1;

  const viable = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !hasDeparted(option, now));

  const pool = viable.length > 0 ? viable : options.map((option, index) => ({ option, index }));

  if (!deadline) return pool[0].index;

  const inTime = pool.find(({ option }) => {
    const verdict = arrivalVerdict(option, deadline);
    return verdict.kind === "onTime" || verdict.kind === "tight";
  });

  if (inTime) return inTime.index;

  const soonest = [...pool].sort((a, b) => {
    const aTime = parseIso(a.option.arrivalTime)?.getTime() ?? Infinity;
    const bTime = parseIso(b.option.arrivalTime)?.getTime() ?? Infinity;
    return aTime - bTime;
  })[0];

  return soonest.index;
}

export function formatStaleness(computedAt: Date | null, now: number): string {
  if (!computedAt) return "not loaded";

  const seconds = Math.max(0, Math.round((now - computedAt.getTime()) / 1000));

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.round(mins / 60);
  return `${hours}h ago`;
}
