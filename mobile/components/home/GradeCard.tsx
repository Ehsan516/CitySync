import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { CourseworkDto } from "@/lib/types";
import { calcGrade, gradeColour, gradeLabel } from "@/lib/CwHelpers";
import { AppColors, Radius, Spacing, Type } from "@/constants/app-theme";

export default function GradeCard({ moduleId, coursework }: { moduleId: number; coursework: CourseworkDto[] }) {
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
        <Text style = {[gradeStyles.hint, {color: AppColors.danger}]}>
            Invalid module input: coursework weighting exceeds 100%
        </Text>
      )}

      {remainingWeight === 0 && (

        <Text style={[gradeStyles.hint, { color: AppColors.success }]}>

          All coursework submitted, final grade is {Math.round(confirmedMark)}%
        </Text>
      )}
    </View>
  );
}

const gradeStyles = StyleSheet.create({

  container: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: AppColors.card2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppColors.border,
    gap: Spacing.sm,
  },

  heading: { ...Type.footnote, color: AppColors.textSecondary },

  barTrack: { flexDirection: "row", height: 6, borderRadius: 99, overflow: "hidden", backgroundColor: AppColors.fill },
  barFill: { backgroundColor: AppColors.primary, borderRadius: 99 },
  barLabel: { color: AppColors.textMuted, fontSize: 11, fontWeight: "600" },

  rangeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: Spacing.xs },
  rangeBox: { alignItems: "center", flex: 1 },
  rangeValue: { color: AppColors.text, fontSize: 22, fontWeight: "800" },
  rangeLabel: { fontSize: 12, fontWeight: "700", marginTop: 2 },

  rangeSep: { color: AppColors.textMuted, fontSize: 15, paddingHorizontal: Spacing.sm },
  hint: { color: AppColors.textMuted, fontSize: 11, lineHeight: 16 },

});
