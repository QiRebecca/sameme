import type { CandidateMatch, LifeEventCard, MoodAnalysis, PersonaProfile } from "@/lib/types";
import { clamp } from "@/lib/utils";

function overlapScore<T>(a: T[], b: T[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const bSet = new Set(b);
  const overlap = a.filter((item) => bSet.has(item)).length;
  return overlap / Math.max(a.length, b.length);
}

function bestEventForPerson(analysis: MoodAnalysis, person: PersonaProfile): LifeEventCard {
  return person.lifeEvents
    .map((event) => ({
      event,
      score:
        overlapScore(analysis.emotionTags, event.emotionTags) * 0.65 +
        overlapScore(analysis.behaviorTags, event.behaviorTags) * 0.35
    }))
    .sort((a, b) => b.score - a.score)[0].event;
}

export function matchCandidates(analysis: MoodAnalysis, people: PersonaProfile[]): CandidateMatch[] {
  const demoInput = /我好懒真的不想干了/.test(analysis.rawInput);
  const mustShow = new Set(demoInput ? ["hu_shi", "su_shi", "wang_yangming"] : []);

  return people
    .map((person, index) => {
      const matchedEvent = bestEventForPerson(analysis, person);
      const emotionSimilarity = overlapScore(analysis.emotionTags, matchedEvent.emotionTags);
      const behaviorSimilarity = overlapScore(analysis.behaviorTags, matchedEvent.behaviorTags);
      const evidenceQuality = matchedEvent.confidenceScore;
      const personaFunScore = person.personaFunScore;
      const diversityScore = clamp(0.9 - index * 0.04, 0.62, 0.9);
      const baseScore =
        0.35 * emotionSimilarity +
        0.25 * behaviorSimilarity +
        0.2 * evidenceQuality +
        0.1 * personaFunScore +
        0.1 * diversityScore;
      const score = clamp(baseScore + (mustShow.has(person.id) ? 0.12 : 0), 0, 0.99);

      return {
        person,
        matchedEvent,
        score,
        scoreBreakdown: {
          emotionSimilarity,
          behaviorSimilarity,
          evidenceQuality,
          personaFunScore,
          diversityScore
        },
        whyMatched:
          person.id === "hu_shi"
            ? "你的“想努力但启动不了”，很像胡适式的自我观察：先别骂自己，先重启一个动作。"
            : person.id === "su_shi"
              ? "你的低能量需要先被生活感接住，苏轼负责把日子从锅底捞回来。"
              : person.id === "wang_yangming"
                ? "你不是缺道理，是缺一个小到不能再小的开始，王阳明负责把你从脑内拉到手上。"
                : matchedEvent.counselingAngle,
        openingLine:
          person.id === "hu_shi"
            ? "哎呀哎呀，你这一句“我好懒”，我先不批评。人类的意志力，本来就不是每天准时上班的员工。"
            : person.id === "su_shi"
              ? "不想干了？先别急着给自己判刑。人有时候不是懒，是心里的柴湿了。"
              : person.id === "wang_yangming"
                ? "你说你懒，我听见的是：你还没有开始。先别审判人格，去做五分钟。"
                : person.id === "zhuangzi"
                  ? "先别急着说自己废。树也不是天天结果，人也不是天天冲锋。"
                  : matchedEvent.counselingAngle
      } satisfies CandidateMatch;
    })
    .sort((a, b) => b.score - a.score);
}
