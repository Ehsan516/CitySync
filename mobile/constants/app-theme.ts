// iOS-inspired dark theme: semantic colors, spacing, radii and type scale
// modelled on Apple's Human Interface Guidelines (system grouped background,
// label hierarchy, SF-style type ramp) so every screen reads as one system.

export const AppColors = {
  // grouped background levels (iOS "systemGroupedBackground" family, dark)
  background: "#000000",
  backgroundElevated: "#0b0b0f",

  card: "#1c1c1e",
  card2: "#2c2c2e",
  cardPressed: "#3a3a3c",

  border: "rgba(255,255,255,0.09)",
  separator: "rgba(255,255,255,0.12)",

  // label hierarchy
  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.72)",
  textMuted: "rgba(255,255,255,0.45)",
  textTertiary: "rgba(255,255,255,0.30)",

  // brand + iOS system colors
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
};

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

// Apple's SF type ramp (size/weight/line-height), used for consistent hierarchy
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

// Header collapse tuning shared by every LargeTitleHeader instance
export const HeaderMetrics = {
  largeTitleHeight: 52,
  compactTitleHeight: 44,
  collapseDistance: 40,
};
