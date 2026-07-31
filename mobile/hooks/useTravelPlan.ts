import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { travelApi } from "@/lib/api";
import type { TravelPlan, TravelPlanQuery } from "@/lib/types";

const AUTO_REFRESH_MS = 60_000;

export type TravelPlanState = {
  plan: TravelPlan | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  computedAt: Date | null;
  refresh: () => void;
};

export function useTravelPlan(query: TravelPlanQuery | null): TravelPlanState {
  const isFocused = useIsFocused();

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef<AbortController | null>(null);

  const queryKey = query ? JSON.stringify(query) : null;

  const loadedKey = useRef<string | null>(null);

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

      setError(result.fallback ? result.notice ?? "Couldn't load live travel times." : null);
    } catch (e: any) {
      if (controller.signal.aborted) return;

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

  useEffect(() => {
    if (!query) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, isFocused, run]);

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

  useEffect(() => {
    return () => inFlight.current?.abort();
  }, []);

  const computedAt = plan?.computedAt ? new Date(plan.computedAt) : null;

  return { plan, loading, refreshing, error, computedAt, refresh };
}
