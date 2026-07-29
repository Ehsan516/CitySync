import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { travelApi } from "@/lib/api";
import type { TravelPlan, TravelPlanQuery } from "@/lib/types";

//how often a focused, foregrounded travel view re-asks the backend
const AUTO_REFRESH_MS = 60_000;

export type TravelPlanState = {
  plan: TravelPlan | null;
  loading: boolean;//true only on the first load for a query, so the board doesn't flash on refresh
  refreshing: boolean;//true for background/pull refreshes
  error: string | null;
  /**when the data on screen was actually computed, null until first success.
   * taken from the backend so a cache hit reports its real age rather than pretending to be new*/
  computedAt: Date | null;
  refresh: () => void;
};

/**owns fetching and refreshing a travel plan
 *
 * refresh policy: manual (pull to refresh / button) plus a 60s timer that only runs while the
 * screen is focused AND the app is foregrounded. that keeps the departure board genuinely live
 * when someone is staring at it after missing a train, without polling google all day in the
 * background. countdowns between refreshes are handled locally by useNow, no api cost.
 *
 * @param query null pauses everything, used while preferences are still loading or the user
 *              has no home address saved yet
 */
export function useTravelPlan(query: TravelPlanQuery | null): TravelPlanState {
  const isFocused = useIsFocused();

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //abort the in flight request when the query changes or the screen goes away, otherwise a slow
  //reply for the old mode can land after a new one and overwrite the board
  const inFlight = useRef<AbortController | null>(null);

  //serialised query, gives a stable dependency without re-fetching on every render
  const queryKey = query ? JSON.stringify(query) : null;

  //tracks which query the currently displayed plan belongs to, so switching mode shows a
  //proper loading state instead of a stale board with the wrong times on it
  const loadedKey = useRef<string | null>(null);

  /*the query is passed in rather than read from a ref, mutating a ref during render upsets the
    react compiler this project has enabled and makes stale reads easy to introduce*/
  const run = useCallback(async (target: TravelPlanQuery, isBackground: boolean) => {
    const key = JSON.stringify(target);

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    const isFirstLoadForQuery = loadedKey.current !== key;

    if (isFirstLoadForQuery) setLoading(true);
    else if (isBackground) setRefreshing(true);

    try {
      const result = await travelApi.getPlan(target, controller.signal);

      if (controller.signal.aborted) return;

      setPlan(result);
      loadedKey.current = key;

      //fallback means the backend reached us but couldn't reach google
      setError(result.fallback ? result.notice ?? "Couldn't load live travel times." : null);
    } catch (e: any) {
      if (controller.signal.aborted) return;

      //keep whatever is on screen, a failed refresh shouldn't blank out a usable board
      setError(e?.bodyText || e?.message || "Couldn't load travel options.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
      if (inFlight.current === controller) inFlight.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    if (!query) return;
    void run(query, true);
  }, [query, run]);

  //initial load, and reload whenever the query genuinely changes
  useEffect(() => {
    if (!query) {
      //clear out a stale board when the query becomes unusable
      inFlight.current?.abort();
      setPlan(null);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      loadedKey.current = null;
      return;
    }

    if (!isFocused) return;

    void run(query, false);
    //queryKey is the real trigger, `query` itself is a fresh object on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, isFocused, run]);

  //auto refresh, only while focused and foregrounded
  useEffect(() => {
    if (!query || !isFocused) return;

    const target = query;

    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer !== null) return;
      timer = setInterval(() => void run(target, true), AUTO_REFRESH_MS);
    }

    function stop() {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    }

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        //coming back from the background, times could be well out of date
        void run(target, true);
        start();
      } else {
        stop();
      }
    });

    if (AppState.currentState === "active") start();

    return () => {
      stop();
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, isFocused, run]);

  //never leave a request hanging when the component unmounts
  useEffect(() => {
    return () => inFlight.current?.abort();
  }, []);

  const computedAt = plan?.computedAt ? new Date(plan.computedAt) : null;

  return { plan, loading, refreshing, error, computedAt, refresh };
}
