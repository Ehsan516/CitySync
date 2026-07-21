import type { CourseworkDto, ModuleDto } from "@/lib/types";

export function calcGrade(cwItems: CourseworkDto[]) {
  //uses only coursework with weightings
  const withWeight = cwItems.filter((c) => c.weighting != null && c.weighting > 0);
  if (withWeight.length === 0) return null;

  const allocWeight = withWeight.reduce((sum, c) => sum + c.weighting!, 0); //allocated weight

  const confirmedMark = withWeight .filter((c) => c.scorePercent != null) .reduce((sum,c)=> sum + (c.weighting! * c.scorePercent! / 100), 0);
  const completedWeight = withWeight
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.weighting!, 0);

  const remainingWeight = Math.max(0,allocWeight - completedWeight);

  //minimum is 0 on remaining coursework
  const predictedMin = Math.round(confirmedMark);
  //max is 100 on remaining coursework
  const predictedMax = Math.min(100, Math.round(confirmedMark + remainingWeight));

  return {
    allocWeight, confirmedMark ,completedWeight,
    remainingWeight, predictedMin,predictedMax,
  };

}

//weighted average of confirmed grades across modules where all allocated coursework is complete
export function calcOverallGrade(modules: ModuleDto[], coursework: CourseworkDto[]) {
  let weightedSum = 0;
  let totalCredits = 0;

  for (const module of modules) {
    if (module.credits == null || module.credits <= 0) continue;
    //skips modules with no credit values

    const cwForModule = coursework.filter((c) => c.moduleId === module.id);
    const grade = calcGrade(cwForModule);

    if (!grade) continue;
    //skip if no grading info

    if (grade.remainingWeight !== 0) continue;//only includes modules where all allocated cw is complete

    weightedSum += grade.confirmedMark * module.credits;
    totalCredits += module.credits;
  }

  if (totalCredits === 0) return null;

  const percent = Math.round((weightedSum / totalCredits) * 100) / 100;

  return { percent, creditsUsed: totalCredits };
}

export function getModuleWeightTotal(moduleId: number, coursework: CourseworkDto[], excludeCourseworkId?: number){
    return coursework.filter(c => c.moduleId === moduleId).filter(c => excludeCourseworkId == null || c.id !== excludeCourseworkId)
    .reduce((sum, c) => sum + (c.weighting ?? 0), 0);

}

export function getReminderLevel(dateTimeString: string){//how urgent cw or exam is
    const due= new Date(dateTimeString);//iso to js date obj
    const ms = due.getTime() - Date.now();//difference between current and due time in miliseconds

    if (isNaN(due.getTime())){
        return { label: "unknown", freq:";("};
        //sad face if time isn't number lol
    }

    const hourMs = 1000*60*60;//1 hr
    const dayMs = hourMs * 24;//1 day

    if (ms < 0){
        return {label: "OVERDUE", freq: "deadline passed"}//if overdue
    }


    /**deadline countdown from 5 days to 1 hour*/
    if (ms <= 1 * hourMs){
        return {label: "URGENT, have you submitted?", freq: "due today"};
    }

    if (ms <= 3 * hourMs){
        return {label: "URGENT", freq: "due today"};
    }

    if (ms <= 5 * dayMs){
        return {label: "SOON", freq:"within 5 days"};
    }

    return {label:"NORMAL", freq: "more than 5 days left :D"};

}

export function gradeLabel(pct: number) {
//percent to uk degree levels

  if (pct >= 70) return "First (1st)";
  if (pct >= 60) return "2:1";
  if (pct >= 50) return "2:2";
  if (pct >= 40) return "Third";
  return "Fail";
}

export function gradeColour(pct: number) {
//colours for grade performance
  if (pct >= 70) return "#00c448";
  if (pct >= 60) return "#9ef916";
  if (pct >= 50) return "#F59E0B";
  if (pct >= 40) return "#F97316";
  return "#EF4444";

}
