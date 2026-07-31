import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";

export function useNow(intervalMs: number = 1000): number {
  const isFocused = useIsFocused();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isFocused) return;

    setNow(Date.now());

    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer !== null) return;
      timer = setInterval(() => setNow(Date.now()), intervalMs);
    }

    function stop() {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    }

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setNow(Date.now());
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
  }, [isFocused, intervalMs]);

  return now;
}
