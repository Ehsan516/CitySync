import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { AppColors } from "@/constants/app-theme";

export default function TabBarBackground() {
  if (Platform.OS !== "ios") {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: AppColors.backgroundElevated }]} />;
  }

  return (
    <BlurView
      tint="systemChromeMaterialDark"
      intensity={95}
      style={StyleSheet.absoluteFill}
    />
  );
}
