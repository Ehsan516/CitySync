import type { RouteOption, TransitSubMode, TravelMode } from "@/lib/types";

/**formatting and verdict helpers shared by the travel tab and the route sheet
 * kept out of the components so the "will I make it" rule is defined in exactly one place*/

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

//google's vehicle type enum is shouty, this makes it readable in the step list
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

//"1h 24m" / "38 min", used for journey lengths
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";

  const totalMins = Math.max(1, Math.round(seconds / 60));//never show "0 min" for a real journey

  if (totalMins < 60) return `${totalMins} min`;

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

//clock time like "14:02"
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

/**countdown to a departure, relative to a ticking now
 * returns null when there's nothing sensible to show*/
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

  //a minute of slack, a train you're technically 30s late for is still worth showing
  return dep.getTime() < now - 60_000;
}

export type ArrivalVerdict =
  | { kind: "none" }//no deadline to judge against
  | { kind: "unknown" }//we have a deadline but google didn't give us an arrival time
  | { kind: "onTime"; sparesMins: number }
  | { kind: "tight"; sparesMins: number }
  | { kind: "late"; lateMins: number };

//under this much slack and it's worth warning the user it'll be tight
const TIGHT_THRESHOLD_MINS = 10;

/**does this option actually get the user there in time?
 *
 * this is the answer to "I missed my train, am I still ok" and it's why arrivalTime is
 * plumbed all the way through from the routes api
 */
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

//"2 changes" / "direct"
export function formatTransfers(transferCount: number | null | undefined): string | null {
  if (transferCount == null) return null;
  if (transferCount <= 0) return "direct";

  return transferCount === 1 ? "1 change" : `${transferCount} changes`;
}

/**picks the option to recommend, the first one that still arrives in time
 * falls back to the soonest arrival when nothing makes it, which is the least bad option
 * for someone who has already missed their train*/
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

  //nothing arrives in time, so recommend whichever gets there soonest
  const soonest = [...pool].sort((a, b) => {
    const aTime = parseIso(a.option.arrivalTime)?.getTime() ?? Infinity;
    const bTime = parseIso(b.option.arrivalTime)?.getTime() ?? Infinity;
    return aTime - bTime;
  })[0];

  return soonest.index;
}

//"updated 12s ago", tells the user how live the board actually is
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
