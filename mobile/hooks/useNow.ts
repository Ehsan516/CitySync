import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";

/**a ticking "now" for countdowns like "departs in 6 min"
 *
 * the whole point is that counting down costs nothing, the departure times we already hold
 * are absolute so the display can tick every second without touching the routes api
 *
 * stops ticking when the screen isn't focused or the app is backgrounded, otherwise every
 * travel screen would keep re-rendering in the background for no reason
 *
 * @param intervalMs how often to tick, 1000 for seconds and 30000 is plenty for minutes-only ui
 */
export function useNow(intervalMs: number = 1000): number {
  const isFocused = useIsFocused();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isFocused) return;

    //jump straight to the real time on focus, the clock may have moved on a lot while away
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
        setNow(Date.now());//resync after being away
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
