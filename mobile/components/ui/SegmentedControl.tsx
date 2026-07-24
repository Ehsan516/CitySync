import React from "react";
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/constants/app-theme";

type Props = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export default function SegmentedControl({ options, selectedIndex, onChange }: Props) {
  function select(index: number) {
    if (index === selectedIndex) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(index);
  }

  return (
    <View style={styles.track}>
      {options.map((label, index) => {
        const active = index === selectedIndex;
        return (
          <Pressable
            key={label}
            onPress={() => select(index)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: AppColors.card2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#2a2a3a",
  },
  label: {
    color: AppColors.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  labelActive: {
    color: AppColors.text,
  },
});
