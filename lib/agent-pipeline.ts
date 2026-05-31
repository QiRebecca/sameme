import { sources } from "@/lib/seed-people";
import { parseMood } from "@/lib/mood-parser";
import { runAgenticMatcher } from "@/lib/agentic-matcher";
import type { AgentTraceStep, CandidateMatch, MoodAnalysis, SourceItem } from "@/lib/types";

function traceStep(id: string, name: string, summary: string): AgentTraceStep {
  return { id, name, status: "done", summary };
}

export async function runSagePipeline(input: string): Promise<{
  analysis: MoodAnalysis;
  trace: AgentTraceStep[];
  candidates: CandidateMatch[];
  recommendedModes: Array<"one_on_one" | "group_chat" | "tiny_action">;
  sources: SourceItem[];
}> {
  const analysis = parseMood(input);
  const baseTrace = [
    traceStep("safety", "Safety Router", "已完成安全分流。"),
    traceStep("situation", "Situation Analyst", "正在用 LLM 理解用户真实处境。"),
    traceStep("search", "Web Search Agent", "正在为候选人物检索公开传记、作品、书信与相关阶段。"),
    traceStep("match", "Experience Matcher", "正在把用户处境匹配到人物的具体人生阶段。"),
    traceStep("council", "Council Composer", "已准备可加入群聊的人物卡片。")
  ];

  if (analysis.riskLevel === "high") {
    return {
      analysis,
      trace: [baseTrace[0], { ...baseTrace[1], summary: "检测到安全风险，暂停历史群聊模式。" }],
      candidates: [],
      recommendedModes: [],
      sources
    };
  }

  const agentic = await runAgenticMatcher(input, analysis);
  const selected = agentic.candidates.slice(0, 8);

  const trace = baseTrace.map((step) => {
    if (step.id === "situation") return { ...step, summary: agentic.summaries[0] ?? step.summary };
    if (step.id === "search") return { ...step, summary: `已抓取/整理 ${agentic.sources.length} 条公开资料片段。` };
    if (step.id === "match") return { ...step, summary: "已匹配到人物的具体阶段、相似点与后来结果。" };
    return step;
  });

  return {
    analysis,
    trace,
    candidates: selected,
    recommendedModes: ["one_on_one", "group_chat", "tiny_action"],
    sources: [...sources, ...agentic.sources]
  };
}
