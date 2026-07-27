import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GlassRadius, Radius, getColors, type ColorTokens } from "@/constants/app-theme";

const SCHEME_KEY = "citysync.theme.scheme.v1";
const GLASS_KEY = "citysync.theme.glass.v1";

export type Scheme = "light" | "dark";

type ThemeContextType = {
  scheme: Scheme;
  glass: boolean;
  colors: ColorTokens;
  radius: typeof Radius;
  setScheme: (scheme: Scheme) => void;
  setGlass: (glass: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>("dark");
  const [glass, setGlassState] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedScheme, savedGlass] = await Promise.all([
          AsyncStorage.getItem(SCHEME_KEY),
          AsyncStorage.getItem(GLASS_KEY),
        ]);
        if (savedScheme === "light" || savedScheme === "dark") setSchemeState(savedScheme);
        if (savedGlass != null) setGlassState(savedGlass === "true");
      } catch {}
    })();
  }, []);

  function setScheme(next: Scheme) {
    setSchemeState(next);
    AsyncStorage.setItem(SCHEME_KEY, next).catch(() => {});
  }

  function setGlass(next: boolean) {
    setGlassState(next);
    AsyncStorage.setItem(GLASS_KEY, String(next)).catch(() => {});
  }

  const colors = useMemo(() => getColors(scheme), [scheme]);
  const radius = useMemo(() => (glass ? GlassRadius : Radius), [glass]);

  const value = useMemo(
    () => ({ scheme, glass, colors, radius, setScheme, setGlass }),
    [scheme, glass, colors, radius]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
