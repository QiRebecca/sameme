export type SafetyRisk = "low" | "medium" | "high";

const highRiskPattern = /(不想活|想死|自杀|伤害自己|结束生命|活着没意思想结束)/;
const mediumRiskPattern = /(没救了|完了|崩溃|撑不住|受不了了)/;

export function detectSafetyRisk(input: string): SafetyRisk {
  if (highRiskPattern.test(input)) return "high";
  if (mediumRiskPattern.test(input)) return "medium";
  return "low";
}

export const safetyMessage =
  "听起来你现在很难受。我不会用玩笑带过这句话。请先联系你身边可信任的人，或当地紧急服务/危机热线。如果你现在有立即危险，请马上拨打当地紧急电话。";
