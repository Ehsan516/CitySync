import React from "react";
import {View, Text, StyleSheet} from "react-native";
import type { CourseworkDto } from "@/lib/CwHelpers";
import { calcGrade, gradeColour, gradeLabel } from "@/lib/CwHelpers";


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
        <Text style = {[gradeStyles.hint, {color: "#EF4444"}]}>
            Invalid module input: coursework weighting exceeds 100%
        </Text>
      )}

      {remainingWeight === 0 && (

        <Text style={[gradeStyles.hint, { color: "#22C55E" }]}>

          All coursework submitted, final grade is {Math.round(confirmedMark)}%
        </Text>
      )}
    </View>
  );
}

const gradeStyles = StyleSheet.create({

  container: {marginTop: 12,padding: 12,borderRadius: 12,backgroundColor: "#0a0a12",borderWidth: 1,
  borderColor: "#2a2a40", gap: 8,},

  heading: {color: "#d6d6df",fontWeight: "700",fontSize: 13,},

  barTrack: { flexDirection: "row", height: 8, borderRadius: 99, overflow: "hidden", backgroundColor: "#1f1f30",},
  barFill: { backgroundColor: "#D70E20", borderRadius: 99,},
  barLabel: { color: "#a9a9b6", fontSize: 11,},

  rangeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: 4,},
  rangeBox: {alignItems: "center",flex: 1,},
  rangeValue: { color: "white", fontSize: 22, fontWeight: "800",},
  rangeLabel: {fontSize: 12, fontWeight: "700", marginTop: 2,},

  rangeHint: {color: "#a9a9b6", fontSize: 10, textAlign: "center", marginTop: 2,},
  rangeSep: {color: "#a9a9b6", fontSize: 18, paddingHorizontal: 8,},
  hint: {color: "#a9a9b6", fontSize: 11,},

});