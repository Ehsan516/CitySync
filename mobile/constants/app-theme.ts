import type { BlurTint } from "expo-blur";

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

export const GlassRadius = {
  sm: 14,
  md: 20,
  lg: 26,
  xl: 32,
  pill: 999,
};

export const GlassTabBar = {
  height: 60,
  bottomMargin: 20,
  sideMargin: 16,
};

export const Type = {
  largeTitle: { fontSize: 34, fontWeight: "800" as const, letterSpacing: 0.2 },
  title1: { fontSize: 28, fontWeight: "800" as const, letterSpacing: 0.1 },
  title2: { fontSize: 22, fontWeight: "700" as const },
  title3: { fontSize: 20, fontWeight: "700" as const },
  headline: { fontSize: 17, fontWeight: "700" as const },
  body: { fontSize: 17, fontWeight: "400" as const },
  callout: { fontSize: 15, fontWeight: "600" as const },
  subhead: { fontSize: 15, fontWeight: "400" as const },
  footnote: { fontSize: 13, fontWeight: "600" as const },
  caption: { fontSize: 12, fontWeight: "600" as const },
};

export type ColorTokens = {
  scheme: "light" | "dark";

  background: string;
  backgroundElevated: string;

  card: string;
  card2: string;
  cardPressed: string;

  border: string;
  separator: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textTertiary: string;

  primary: string;
  primaryMuted: string;
  accent: string;
  accentMuted: string;

  success: string;
  successMuted: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;

  fill: string;
  fillSecondary: string;

  blurTint: BlurTint;
  glassBg: string;
  glassBgStrong: string;
  glassStroke: string;
  glassHighlight: string;
  primaryGlassBg: string;
  dangerGlassBg: string;
};

const dark: ColorTokens = {
  scheme: "dark",

  background: "#000000",
  backgroundElevated: "#0b0b0f",

  card: "#1c1c1e",
  card2: "#2c2c2e",
  cardPressed: "#3a3a3c",

  border: "rgba(255,255,255,0.09)",
  separator: "rgba(255,255,255,0.12)",

  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.72)",
  textMuted: "rgba(255,255,255,0.45)",
  textTertiary: "rgba(255,255,255,0.30)",

  primary: "#D70E20",
  primaryMuted: "rgba(215,14,32,0.16)",
  accent: "#0A84FF",
  accentMuted: "rgba(10,132,255,0.16)",

  success: "#30D158",
  successMuted: "rgba(48,209,88,0.16)",
  danger: "#FF453A",
  dangerMuted: "rgba(255,69,58,0.16)",
  warning: "#FF9F0A",
  warningMuted: "rgba(255,159,10,0.16)",

  fill: "rgba(120,120,128,0.24)",
  fillSecondary: "rgba(120,120,128,0.16)",

  blurTint: "systemChromeMaterialDark",
  glassBg: "rgba(255,255,255,0.08)",
  glassBgStrong: "rgba(255,255,255,0.14)",
  glassStroke: "rgba(255,255,255,0.18)",
  glassHighlight: "rgba(255,255,255,0.35)",
  primaryGlassBg: "rgba(215,14,32,0.55)",
  dangerGlassBg: "rgba(255,69,58,0.45)",
};

const light: ColorTokens = {
  scheme: "light",

  background: "#F2F2F7",
  backgroundElevated: "#FFFFFF",

  card: "#FFFFFF",
  card2: "#F2F2F7",
  cardPressed: "#E5E5EA",

  border: "rgba(0,0,0,0.08)",
  separator: "rgba(60,60,67,0.29)",

  text: "#000000",
  textSecondary: "rgba(60,60,67,0.68)",
  textMuted: "rgba(60,60,67,0.38)",
  textTertiary: "rgba(60,60,67,0.20)",

  primary: "#D70E20",
  primaryMuted: "rgba(215,14,32,0.12)",
  accent: "#007AFF",
  accentMuted: "rgba(0,122,255,0.12)",

  success: "#34C759",
  successMuted: "rgba(52,199,89,0.14)",
  danger: "#FF3B30",
  dangerMuted: "rgba(255,59,48,0.12)",
  warning: "#FF9500",
  warningMuted: "rgba(255,149,0,0.14)",

  fill: "rgba(120,120,128,0.20)",
  fillSecondary: "rgba(120,120,128,0.12)",

  blurTint: "systemChromeMaterialLight",
  glassBg: "rgba(255,255,255,0.55)",
  glassBgStrong: "rgba(255,255,255,0.75)",
  glassStroke: "rgba(255,255,255,0.85)",
  glassHighlight: "rgba(255,255,255,0.95)",
  primaryGlassBg: "rgba(215,14,32,0.82)",
  dangerGlassBg: "rgba(255,59,48,0.78)",
};

export function getColors(scheme: "light" | "dark"): ColorTokens {
  return scheme === "light" ? light : dark;
}

export const AppColors: ColorTokens = dark;
