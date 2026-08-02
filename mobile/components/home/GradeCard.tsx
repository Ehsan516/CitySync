import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { CourseworkDto } from "@/lib/types";
import { calcGrade, gradeColour, gradeLabel } from "@/lib/CwHelpers";
import { FontFamily, Radius, Spacing, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

export default function GradeCard({ moduleId, coursework }: { moduleId: number; coursework: CourseworkDto[] }) {
  const { colors, radius } = useTheme();
  const gradeStyles = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  const cwForModule = coursework.filter((c) => c.moduleId === moduleId);
  //only use cw belonging to current module
  const grade = calcGrade(cwForModule);//calculates allocated,completed weighting and min/max grades

  if (!grade) {
  //if no cw data to estimate grade
    return (

      <View style={gradeStyles.container}>
        <Text style={gradeStyles.heading}>Grade Prediction</Text>
        <Text style={gradeStyles.hint}>
          Add coursework with weightings to see your predicted grade.
        </Text>
      </View>

    );
  }



  const { allocWeight, confirmedMark ,completedWeight, remainingWeight, predictedMin, predictedMax } = grade;
  //^calculated vals for display

  const progressFraction = allocWeight > 0 ? completedWeight / allocWeight : 0;
  //^completed weighting shown as fraction of allocated weighting

  return (
    <View style={gradeStyles.container}>
      <Text style={gradeStyles.heading}>Grade Prediction</Text>

      {/*progress bar show how much of allocated module weighting already completed*/}
      <View style={gradeStyles.barTrack}>
        <View style={[gradeStyles.barFill, { flex: progressFraction }]} />
        <View style={{ flex: 1 - progressFraction }} />
      </View>

      <Text style={gradeStyles.barLabel}>
        {completedWeight}% of {allocWeight}% submitted
        {remainingWeight > 0 ? ` • ${remainingWeight}% remaining` : " all submitted"}
      </Text>

      {/*grade range from 0 to 100%*/}
      <View style={gradeStyles.rangeRow}>
        <View style={gradeStyles.rangeBox}>

          <Text style={gradeStyles.rangeValue}>{predictedMin}%</Text>
          <Text style={[gradeStyles.rangeLabel, { color: gradeColour(predictedMin) }]}>

            {gradeLabel(predictedMin)}

          </Text>

        </View>

        <Text style={gradeStyles.rangeSep}>to</Text>

        <View style={gradeStyles.rangeBox}>
          <Text style={gradeStyles.rangeValue}>{predictedMax}%</Text>

          <Text style={[gradeStyles.rangeLabel, { color: gradeColour(predictedMax) }]}>
            {gradeLabel(predictedMax)}
          </Text>


        </View>
      </View>

      {allocWeight > 100 &&( //if saved weighting > 100
        <Text style = {[gradeStyles.hint, {color: colors.danger}]}>
            Invalid module input: coursework weighting exceeds 100%
        </Text>
      )}

      {remainingWeight === 0 && (

        <Text style={[gradeStyles.hint, { color: colors.success }]}>

          All coursework submitted, final grade is {Math.round(confirmedMark)}%
        </Text>
      )}
    </View>
  );
}

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({

  container: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: Spacing.sm,
  },

  heading: { fontSize: 13, fontWeight: "600", fontFamily: FontFamily.semibold, color: colors.textSecondary },

  barTrack: { flexDirection: "row", height: 6, borderRadius: 99, overflow: "hidden", backgroundColor: colors.fill },
  barFill: { backgroundColor: colors.primary, borderRadius: 99 },
  barLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600", fontFamily: FontFamily.semibold },

  rangeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: Spacing.xs },
  rangeBox: { alignItems: "center", flex: 1 },
  rangeValue: { color: colors.text, fontSize: 22, fontWeight: "800", fontFamily: FontFamily.extrabold },
  rangeLabel: { fontSize: 12, fontWeight: "700", fontFamily: FontFamily.bold, marginTop: 2 },

  rangeSep: { color: colors.textMuted, fontSize: 15, paddingHorizontal: Spacing.sm },
  hint: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },

  });
}
