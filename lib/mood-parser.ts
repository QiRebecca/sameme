import type { BehaviorTag, EmotionTag, MoodAnalysis } from "@/lib/types";
import { detectSafetyRisk } from "@/lib/safety";

function pushUnique<T>(target: T[], ...items: T[]) {
  for (const item of items) {
    if (!target.includes(item)) target.push(item);
  }
}

export function parseMood(input: string): MoodAnalysis {
  const emotionTags: EmotionTag[] = [];
  const behaviorTags: BehaviorTag[] = [];
  const riskLevel = detectSafetyRisk(input);

  if (/(懒|不想干|摆烂|躺|废了|不想动)/.test(input)) {
    pushUnique(emotionTags, "low_energy", "procrastination", "self_blame", "avoidance", "task_aversion");
    pushUnique(behaviorTags, "lying_flat", "starting_failure", "self_reflection");
  }

  if (/(怕失败|不敢开始|怕做不好|失败)/.test(input)) {
    pushUnique(emotionTags, "fear_of_failure", "avoidance", "overthinking");
    pushUnique(behaviorTags, "overplanning", "starting_failure");
  }

  if (/(在意别人|被评价|别人怎么看|丢脸|老板骂|被骂)/.test(input)) {
    pushUnique(emotionTags, "external_judgment", "self_blame", "need_comfort");
    pushUnique(behaviorTags, "retreat", "self_reflection");
  }

  if (/(没意义|空|麻木|人生好没意义|意义)/.test(input)) {
    pushUnique(emotionTags, "meaning_crisis", "burnout", "need_comfort");
    pushUnique(behaviorTags, "retreat", "lying_flat");
  }

  if (/(被边缘|被裁|裁员|失败|失去|降级)/.test(input)) {
    pushUnique(emotionTags, "status_loss", "need_comfort", "self_blame");
    pushUnique(behaviorTags, "retreat", "self_reflection");
  }

  if (emotionTags.length === 0) {
    pushUnique(emotionTags, "need_comfort", "overthinking");
    pushUnique(behaviorTags, "self_reflection");
  }

  if (emotionTags.includes("procrastination") || emotionTags.includes("avoidance")) {
    pushUnique(emotionTags, "need_action");
    pushUnique(behaviorTags, "tiny_action");
  }

  const detectedMode =
    emotionTags.includes("low_energy") && emotionTags.includes("procrastination")
      ? "low_energy_procrastination"
      : riskLevel === "high"
        ? "safety_support"
        : "emotional_mirror";

  const summaryForUser =
    detectedMode === "low_energy_procrastination"
      ? "你不是道德败坏，更像是低能量 + 启动困难 + 一点点自责。"
      : riskLevel === "high"
        ? "这句话可能不只是“不想学习/工作”，需要先照顾安全。"
        : "我听见的是一团还没展开的压力，不急着给你贴标签。";

  return {
    rawInput: input,
    riskLevel,
    detectedMode,
    emotionTags,
    behaviorTags,
    toneNeeded: riskLevel === "high" ? ["gentle", "direct", "non_judgmental"] : ["cute", "warm", "light_wit"],
    userNeed: riskLevel === "high" ? "safety_support" : "start_a_tiny_action",
    summaryForUser
  };
}
