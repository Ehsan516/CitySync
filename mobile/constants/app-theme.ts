import type { BlurTint } from "expo-blur";

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 34,
};

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  pill: 999,
};

export const GlassRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const GlassTabBar = {
  height: 60,
  bottomMargin: 20,
  sideMargin: 16,
};

export const FontFamily = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
};

export function fontForWeight(weight?: string): string {
  switch (weight) {
    case "800":
      return FontFamily.extrabold;
    case "700":
      return FontFamily.bold;
    case "600":
      return FontFamily.semibold;
    case "500":
      return FontFamily.medium;
    default:
      return FontFamily.regular;
  }
}

export const Type = {
  largeTitle: {
    fontSize: 34,
    fontWeight: "800" as const,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.2,
  },
  title1: {
    fontSize: 28,
    fontWeight: "800" as const,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.1,
  },
  title2: { fontSize: 22, fontWeight: "700" as const, fontFamily: FontFamily.bold },
  title3: { fontSize: 20, fontWeight: "700" as const, fontFamily: FontFamily.bold },
  headline: { fontSize: 17, fontWeight: "700" as const, fontFamily: FontFamily.bold },
  body: { fontSize: 17, fontWeight: "400" as const, fontFamily: FontFamily.regular },
  callout: { fontSize: 15, fontWeight: "600" as const, fontFamily: FontFamily.semibold },
  subhead: { fontSize: 15, fontWeight: "400" as const, fontFamily: FontFamily.regular },
  footnote: { fontSize: 13, fontWeight: "600" as const, fontFamily: FontFamily.semibold },
  caption: { fontSize: 12, fontWeight: "600" as const, fontFamily: FontFamily.semibold },
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
  onPrimary: string;
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

  background: "#0B0C10",
  backgroundElevated: "#12141B",

  card: "#1F2833",
  card2: "#29323E",
  cardPressed: "#333D4B",

  border: "rgba(0,240,255,0.14)",
  separator: "rgba(0,240,255,0.18)",

  text: "#EAFEFF",
  textSecondary: "rgba(234,254,255,0.72)",
  textMuted: "rgba(234,254,255,0.45)",
  textTertiary: "rgba(234,254,255,0.28)",

  primary: "#00F0FF",
  primaryMuted: "rgba(0,240,255,0.16)",
  onPrimary: "#04191C",
  accent: "#FF0055",
  accentMuted: "rgba(255,0,85,0.16)",

  success: "#39FF88",
  successMuted: "rgba(57,255,136,0.16)",
  danger: "#FF3355",
  dangerMuted: "rgba(255,51,85,0.16)",
  warning: "#FFC400",
  warningMuted: "rgba(255,196,0,0.16)",

  fill: "rgba(0,240,255,0.08)",
  fillSecondary: "rgba(0,240,255,0.05)",

  blurTint: "systemChromeMaterialDark",
  glassBg: "rgba(31,40,51,0.55)",
  glassBgStrong: "rgba(31,40,51,0.78)",
  glassStroke: "rgba(0,240,255,0.18)",
  glassHighlight: "rgba(0,240,255,0.35)",
  primaryGlassBg: "rgba(0,240,255,0.45)",
  dangerGlassBg: "rgba(255,51,85,0.45)",
};

const light: ColorTokens = {
  scheme: "light",

  background: "#FBF9F5",
  backgroundElevated: "#FFFFFF",

  card: "#FFFFFF",
  card2: "#F3EFE7",
  cardPressed: "#EAE3D6",

  border: "rgba(28,28,28,0.08)",
  separator: "rgba(28,28,28,0.12)",

  text: "#1C1C1C",
  textSecondary: "rgba(28,28,28,0.68)",
  textMuted: "rgba(28,28,28,0.42)",
  textTertiary: "rgba(28,28,28,0.24)",

  primary: "#BC002D",
  primaryMuted: "rgba(188,0,45,0.12)",
  onPrimary: "#FFFFFF",
  accent: "#2A4B3D",
  accentMuted: "rgba(42,75,61,0.12)",

  success: "#2A4B3D",
  successMuted: "rgba(42,75,61,0.14)",
  danger: "#BC002D",
  dangerMuted: "rgba(188,0,45,0.12)",
  warning: "#C98A2B",
  warningMuted: "rgba(201,138,43,0.14)",

  fill: "rgba(28,28,28,0.06)",
  fillSecondary: "rgba(28,28,28,0.04)",

  blurTint: "systemChromeMaterialLight",
  glassBg: "rgba(251,249,245,0.6)",
  glassBgStrong: "rgba(251,249,245,0.82)",
  glassStroke: "rgba(28,28,28,0.08)",
  glassHighlight: "rgba(255,255,255,0.9)",
  primaryGlassBg: "rgba(188,0,45,0.82)",
  dangerGlassBg: "rgba(188,0,45,0.78)",
};

export function getColors(scheme: "light" | "dark"): ColorTokens {
  return scheme === "light" ? light : dark;
}

export const AppColors: ColorTokens = dark;
