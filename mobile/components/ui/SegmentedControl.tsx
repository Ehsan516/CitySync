import React, { useMemo } from "react";
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from "react-native";
import { FontFamily, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

export default function SegmentedControl({ options, selectedIndex, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: colors.card2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.cardPressed,
    },
    label: {
      color: colors.textMuted,
      fontWeight: "600",
      fontFamily: FontFamily.semibold,
      fontSize: 13,
    },
    labelActive: {
      color: colors.text,
    },
  });
}
