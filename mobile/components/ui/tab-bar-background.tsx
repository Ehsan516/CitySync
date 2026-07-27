import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function TabBarBackground() {
  const { colors, glass } = useTheme();

  if (Platform.OS !== "ios") {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: glass ? colors.glassBgStrong : colors.backgroundElevated },
        ]}
      />
    );
  }

  return (
    <>
      <BlurView tint={colors.blurTint} intensity={glass ? 80 : 95} style={StyleSheet.absoluteFill} />
      {glass ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassBg }]} /> : null}
    </>
  );
}
