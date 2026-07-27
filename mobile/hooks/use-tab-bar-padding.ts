import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassTabBar, Spacing } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

export function useTabBarPadding() {
  const { glass } = useTheme();
  const insets = useSafeAreaInsets();

  if (!glass) return 0;

  return GlassTabBar.height + GlassTabBar.bottomMargin + insets.bottom + Spacing.md;
}
