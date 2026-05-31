import { z } from "zod";
import { generateJsonWithLLM } from "@/lib/llm";
import { matchCandidates } from "@/lib/matcher";
import { retrievePersonaContext } from "@/lib/persona-rag";
import { people } from "@/lib/seed-people";
import type { CandidateMatch, LifeEventCard, MoodAnalysis, PersonaMemoryChunk, PersonaProfile, SourceItem } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { fetchWebRagChunks } from "@/lib/web-rag";

const situationSchema = z.object({
  situation: z.string(),
  emotionalState: z.array(z.string()).default([]),
  lifeProblem: z.string(),
  desiredConversation: z.string(),
  candidatePersonIds: z.array(z.string()).min(1).max(8)
});

const matchRowSchema = z.object({
  personId: z.string(),
  lifeStageTitle: z.string(),
  period: z.string().optional(),
  factualBasis: z.string(),
  similarityToUser: z.string(),
  futureOutcome: z.string(),
  whyThisPersonShouldJoin: z.string(),
  openingLine: z.string(),
  confidenceScore: z.number().min(0).max(1).default(0.72),
  sourceTitles: z.array(z.string()).default([])
});

const singleMatchSchema = z.object({
  match: matchRowSchema
});

function compactPeopleForLLM() {
  return people.map((person) => ({
    id: person.id,
    nameZh: person.nameZh,
    nameEn: person.nameEn,
    era: person.era,
    identity: person.identity,
    role: person.roleInCouncil,
    knownUsefulStages: person.lifeEvents.map((event) => ({
      title: event.title,
      period: event.period,
      factualBasis: event.factualBasis,
      caveat: event.caveat
    }))
  }));
}

function compactChunks(chunks: PersonaMemoryChunk[], limit = 5) {
  return chunks.slice(0, limit).map((chunk) => ({
    title: chunk.title,
    sourceLabel: chunk.sourceLabel,
    kind: chunk.kind,
    confidenceScore: chunk.confidenceScore,
    content: chunk.content.slice(0, 320),
    caveat: chunk.caveat
  }));
}

function compactEvidenceChunks(localChunks: PersonaMemoryChunk[], webChunks: PersonaMemoryChunk[], limit = 4) {
  const merged = [...localChunks, ...webChunks.filter((chunk) => !chunk.sourceLabel.startsWith("Open Library"))];
  const deduped = new Map<string, PersonaMemoryChunk>();
  for (const chunk of merged) {
    const key = `${chunk.title}:${chunk.content.slice(0, 80)}`;
    if (!deduped.has(key)) deduped.set(key, chunk);
  }

  return compactChunks(Array.from(deduped.values()), limit);
}

function chunkToSource(chunk: PersonaMemoryChunk): SourceItem {
  const sourceType: SourceItem["sourceType"] = chunk.sourceLabel.includes("wikipedia")
    ? "wikipedia"
    : chunk.kind === "diary_note"
      ? "diary"
      : chunk.kind === "work_note"
        ? "book"
        : "article";

  return {
    id: chunk.id,
    title: chunk.title,
    url: chunk.sourceId.startsWith("http") ? chunk.sourceId : undefined,
    sourceType,
    note: `${chunk.sourceLabel}: ${chunk.content.slice(0, 180)}`
  };
}

function fallbackSituation(analysis: MoodAnalysis) {
  const fallback = matchCandidates(analysis, people).slice(0, 6);
  return {
    situation: analysis.detectedMode,
    emotionalState: analysis.emotionTags,
    lifeProblem: analysis.summaryForUser,
    desiredConversation: "想和有类似境遇的人聊聊他们当时发生了什么。",
    candidatePersonIds: fallback.map((candidate) => candidate.person.id)
  };
}

function fallbackMatch(person: PersonaProfile, analysis: MoodAnalysis, chunks: PersonaMemoryChunk[]): CandidateMatch {
  const base = matchCandidates(analysis, [person])[0];
  const firstChunk = chunks.find((chunk) => !isNoisyChunk(chunk));
  const matchedEvent: LifeEventCard = {
    ...base.matchedEvent,
    title: base.matchedEvent.title,
    factualBasis: firstChunk
      ? `${base.matchedEvent.factualBasis} 联网/记忆补充：${firstChunk.title}：${firstChunk.content.slice(0, 220)}`
      : base.matchedEvent.factualBasis,
    caveat: firstChunk?.caveat ?? base.matchedEvent.caveat,
    modernAnalogy: base.matchedEvent.modernAnalogy,
    counselingAngle: "先让这个人物讲讲自己当时的处境、怎么想、后来怎样。"
  };

  return {
    ...base,
    matchedEvent,
    whyMatched: base.whyMatched,
    openingLine: base.openingLine
  };
}

function looksLikeSourceTitle(title: string) {
  return /poems|shu yu ci|傳記文學|传记文学|第一批国家珍贵古籍|open library|wikipedia|wikisource|works|letters/i.test(title);
}

function isNoisyChunk(chunk?: PersonaMemoryChunk) {
  if (!chunk) return true;
  return chunk.sourceLabel.startsWith("Open Library") || looksLikeSourceTitle(chunk.title);
}

function stageTitleFor(person: PersonaProfile, proposed: string) {
  if (!proposed || looksLikeSourceTitle(proposed)) return person.lifeEvents[0]?.title ?? `${person.nameZh} 的相似人生阶段`;
  return proposed;
}

export async function runAgenticMatcher(input: string, analysis: MoodAnalysis): Promise<{
  candidates: CandidateMatch[];
  sources: SourceItem[];
  summaries: string[];
}> {
  const situationFallback = fallbackSituation(analysis);
  const situation = await generateJsonWithLLM(
    [
      "你是“俺也一样”的处境理解 agent。",
      "不要用关键词规则。请把用户的话理解成一个真实人生处境：职场、学业、创作、关系、挫败、拖延、失去位置等。",
      "你的任务是从候选历史人物中挑出最可能有相似人生阶段的人，后续会对这些人做 web RAG。",
      "选择标准是“具体人生阶段相似”，不是“这个人一般很会安慰”。例如：职场不顺/不受领导重视/升降被贬，优先考虑有仕途受挫、贬谪、被排挤、壮志难酬、重新站起来等阶段的人。",
      "请返回 4-6 位候选，让用户能在卡片里选择；不要只返回一位。",
      "只返回 JSON。candidatePersonIds 必须来自给定列表。"
    ].join("\n"),
    JSON.stringify({
      userInput: input,
      availablePeople: compactPeopleForLLM(),
      outputShape:
        "{ situation, emotionalState: string[], lifeProblem, desiredConversation, candidatePersonIds: string[4-6] }"
    }),
    situationFallback,
    { temperature: 0.35, maxTokens: 1200, timeoutMs: 28000 }
  );

  const parsedSituation = situationSchema.safeParse(situation);
  const validIds = new Set(people.map((person) => person.id));
  const candidateIds = (parsedSituation.success ? parsedSituation.data.candidatePersonIds : situationFallback.candidatePersonIds)
    .filter((id) => validIds.has(id))
    .slice(0, 8);
  const expandedCandidateIds = Array.from(new Set([...(candidateIds.length ? candidateIds : []), ...situationFallback.candidatePersonIds])).slice(0, 5);
  const selectedPeople = (expandedCandidateIds.length ? expandedCandidateIds : situationFallback.candidatePersonIds)
    .map((id) => people.find((person) => person.id === id))
    .filter(Boolean) as PersonaProfile[];

  const webEntries = await Promise.all(
    selectedPeople.map(async (person) => ({
      person,
      localChunks: retrievePersonaContext(person, analysis, 4),
      chunks: await fetchWebRagChunks(person, 4, analysis)
    }))
  );
  const sources = webEntries.flatMap((entry) => entry.chunks.map(chunkToSource));

  const matchRows = await Promise.all(
    webEntries.map(async ({ person, localChunks, chunks }) => {
      const local = fallbackMatch(person, analysis, localChunks);
      const fallbackRow = {
        personId: person.id,
        lifeStageTitle: local.matchedEvent.title,
        period: local.matchedEvent.period,
        factualBasis: local.matchedEvent.factualBasis,
        similarityToUser: local.matchedEvent.modernAnalogy,
        futureOutcome: "这段经历后来成为其人物气质或作品/思想的一部分。",
        whyThisPersonShouldJoin: local.whyMatched,
        openingLine: local.openingLine,
        confidenceScore: local.matchedEvent.confidenceScore,
        sourceTitles: chunks.slice(0, 3).map((chunk) => chunk.title)
      };

      const llmMatch = await generateJsonWithLLM(
        [
          "你是“俺也一样”的单人物经历匹配 agent。",
          "只判断这个历史人物是否能接住用户的处境，并匹配一个具体人生阶段/事件/决策。",
          "必须说明：当时发生了什么、为什么像用户、这个人怎么处理/怎么想、后来结果如何。",
          "lifeStageTitle 必须是人生阶段/事件名，禁止使用资料标题、书名、网页条目名。",
          "openingLine 要像群聊第一句话，短、自然、像这个人出来说“俺也一样”；不要心理咨询话术，不要给任务。",
          "不能编造直接引语；拟态台词不能说成原话。",
          "只返回 JSON。"
        ].join("\n"),
        JSON.stringify({
          userInput: input,
          situation: parsedSituation.success ? parsedSituation.data : situationFallback,
          persona: {
            id: person.id,
            nameZh: person.nameZh,
            role: person.roleInCouncil,
            personaTagline: person.personaTagline,
            trustedStageContext: compactChunks(localChunks, 3),
            seedLifeEvents: person.lifeEvents.map((event) => ({
              title: event.title,
              factualBasis: event.factualBasis,
              caveat: event.caveat
            })),
            webContext: compactEvidenceChunks(localChunks, chunks, 3)
          },
          outputShape:
            "{ match: { personId, lifeStageTitle, period, factualBasis, similarityToUser, futureOutcome, whyThisPersonShouldJoin, openingLine, confidenceScore, sourceTitles } }"
        }),
        { match: fallbackRow },
        { temperature: 0.32, maxTokens: 650, timeoutMs: 14000 }
      );

      const parsed = singleMatchSchema.safeParse(llmMatch);
      return parsed.success ? parsed.data.match : fallbackRow;
    })
  );
  const fallbackByPerson = new Map(webEntries.map((entry) => [entry.person.id, fallbackMatch(entry.person, analysis, entry.localChunks)]));

  const candidates = matchRows
    .map((row, index) => {
      const person = people.find((item) => item.id === row.personId);
      const fallback = fallbackByPerson.get(row.personId);
      if (!person || !fallback) return null;

      const matchedEvent: LifeEventCard = {
        id: `agentic-${person.id}-${index}`,
        personId: person.id,
        title: stageTitleFor(person, row.lifeStageTitle),
        period: row.period,
        factualBasis: row.factualBasis,
        caveat: person.lifeEvents[0]?.caveat ?? "联网与本地资料仅作背景；角色发言为拟态演绎，不代表历史人物原话。",
        modernAnalogy: row.similarityToUser,
        emotionTags: fallback.matchedEvent.emotionTags,
        behaviorTags: fallback.matchedEvent.behaviorTags,
        counselingAngle: row.futureOutcome,
        confidenceScore: clamp(row.confidenceScore, 0.45, 0.95),
        sourceIds: sources
          .filter((source) => row.sourceTitles.some((title) => source.title.includes(title) || title.includes(source.title)))
          .map((source) => source.id)
      };
      if (matchedEvent.sourceIds.length === 0) {
        matchedEvent.sourceIds = sources.filter((source) => source.id.includes(person.id)).slice(0, 3).map((source) => source.id);
      }

      return {
        person,
        matchedEvent,
        score: clamp(0.52 + matchedEvent.confidenceScore * 0.4 + (selectedPeople.length - index) * 0.015, 0, 0.98),
        scoreBreakdown: {
          emotionSimilarity: fallback.scoreBreakdown.emotionSimilarity,
          behaviorSimilarity: fallback.scoreBreakdown.behaviorSimilarity,
          evidenceQuality: matchedEvent.confidenceScore,
          personaFunScore: person.personaFunScore,
          diversityScore: fallback.scoreBreakdown.diversityScore
        },
        whyMatched: row.whyThisPersonShouldJoin,
        openingLine: row.openingLine
      } satisfies CandidateMatch;
    })
    .filter(Boolean) as CandidateMatch[];

  return {
    candidates: candidates.length ? candidates : Array.from(fallbackByPerson.values()),
    sources,
    summaries: [
      parsedSituation.success
        ? `LLM 识别处境：${parsedSituation.data.situation} / ${parsedSituation.data.lifeProblem}`
        : "LLM 处境理解失败，使用本地兜底。",
      `已对 ${selectedPeople.length} 位候选人物进行联网 RAG。`
    ]
  };
}
