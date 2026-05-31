import type { MoodAnalysis, PersonaMemoryChunk, PersonaProfile } from "@/lib/types";
import { fetchWikiSummary } from "@/lib/wiki";

type WikiProject = "wikipedia" | "wikisource";
type WikiLang = "zh" | "en";

type SearchItem = {
  title: string;
  snippet?: string;
};

type ExtractResult = {
  title: string;
  extract: string;
  url: string;
  project: WikiProject;
  lang: WikiLang;
  query: string;
};

type OpenLibraryDoc = {
  title?: string;
  first_publish_year?: number;
  author_name?: string[];
  key?: string;
};

const webChunkCache = new Map<string, PersonaMemoryChunk[]>();

function isWebRagEnabled() {
  return process.env.ENABLE_WEB_RAG === "true" || process.env.ENABLE_WEB_INGEST === "true";
}

function hash(input: string) {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) >>> 0;
  }
  return value.toString(36);
}

function stripHtml(input = "") {
  return input
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function trimText(input: string, max = 760) {
  const clean = input.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 1800): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "SageMatchHackathonDemo/0.1"
      },
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function apiBase(project: WikiProject, lang: WikiLang) {
  return `https://${lang}.${project}.org/w/api.php`;
}

function pageUrl(project: WikiProject, lang: WikiLang, title: string) {
  return `https://${lang}.${project}.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

async function mediaWikiSearch(project: WikiProject, lang: WikiLang, query: string, limit = 3) {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srnamespace: "0",
    srsearch: query,
    srlimit: String(limit),
    format: "json",
    origin: "*"
  });
  const data = await fetchJsonWithTimeout<{ query?: { search?: SearchItem[] } }>(
    `${apiBase(project, lang)}?${params.toString()}`
  );

  return data?.query?.search ?? [];
}

async function mediaWikiExtract(project: WikiProject, lang: WikiLang, title: string, query: string) {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    titles: title,
    redirects: "1",
    explaintext: "1",
    exchars: project === "wikisource" ? "1100" : "850",
    format: "json",
    origin: "*"
  });

  if (project === "wikipedia") {
    params.set("exintro", "1");
  }

  const data = await fetchJsonWithTimeout<{ query?: { pages?: Record<string, { title?: string; extract?: string }> } }>(
    `${apiBase(project, lang)}?${params.toString()}`
  );
  const page = Object.values(data?.query?.pages ?? {})[0];
  const extract = trimText(page?.extract ?? "");

  if (!extract || extract.length < 40) return null;
  return {
    title: page?.title ?? title,
    extract,
    url: pageUrl(project, lang, page?.title ?? title),
    project,
    lang,
    query
  } satisfies ExtractResult;
}

async function fetchOpenLibraryChunks(person: PersonaProfile, limit = 3): Promise<PersonaMemoryChunk[]> {
  const params = new URLSearchParams({
    author: person.nameEn,
    limit: String(limit),
    fields: "title,author_name,first_publish_year,key"
  });
  const data = await fetchJsonWithTimeout<{ docs?: OpenLibraryDoc[] }>(
    `https://openlibrary.org/search.json?${params.toString()}`,
    2200
  );

  return (data?.docs ?? [])
    .filter((doc) => doc.title)
    .slice(0, limit)
    .map((doc) => {
      const url = doc.key ? `https://openlibrary.org${doc.key}` : "https://openlibrary.org/search";
      const year = doc.first_publish_year ? `，首版约 ${doc.first_publish_year}` : "";
      const authors = doc.author_name?.slice(0, 3).join("、") || person.nameEn;

      return {
        id: `openlibrary-${person.id}-${hash(`${doc.title}:${doc.key ?? ""}`)}`,
        personId: person.id,
        title: doc.title ?? `${person.nameEn} work`,
        sourceId: url,
        sourceLabel: `Open Library: ${doc.title}`,
        kind: "work_note",
        content: `Open Library 检索到与 ${person.nameEn} 相关的作品/版本：《${doc.title}》（作者字段：${authors}${year}）。这可作为作品谱系或传记阅读线索，不能当作文本原文。`,
        tags: [...person.suitableFor, "voice"],
        confidenceScore: 0.58,
        isDirectQuote: false,
        caveat: "Open Library 返回的是书目元数据，不是作品全文；仅作为联网RAG线索。"
      } satisfies PersonaMemoryChunk;
    });
}

async function fetchWikiSummaryChunk(person: PersonaProfile): Promise<PersonaMemoryChunk | null> {
  const source = await fetchWikiSummary(person);
  if (!source) return null;

  return {
    id: `wiki-summary-${person.id}-${hash(source.note)}`,
    personId: person.id,
    title: source.title,
    sourceId: source.url ?? source.id,
    sourceLabel: `Wikipedia summary: ${source.title}`,
    kind: "biographical_fact",
    content: trimText(source.note, 760),
    tags: [...person.suitableFor, "turning_point"],
    confidenceScore: 0.7,
    isDirectQuote: false,
    caveat: "Wikipedia 摘要只作为人物生平背景，不作为逐字引文。"
  };
}

function personQueries(person: PersonaProfile) {
  const zh = person.nameZh;
  const en = person.nameEn;
  return [
    { project: "wikipedia" as const, lang: "zh" as const, query: zh, limit: 2 },
    { project: "wikisource" as const, lang: "zh" as const, query: `${zh} 日记`, limit: 2 },
    { project: "wikisource" as const, lang: "zh" as const, query: `${zh} 书信`, limit: 2 },
    { project: "wikisource" as const, lang: "zh" as const, query: `${zh} 文集 OR 年谱 OR 自传`, limit: 2 },
    { project: "wikipedia" as const, lang: "en" as const, query: en, limit: 1 },
    { project: "wikisource" as const, lang: "en" as const, query: `${en} letters diary works`, limit: 2 }
  ];
}

function inferKind(result: ExtractResult): PersonaMemoryChunk["kind"] {
  const title = result.title.toLowerCase();
  const query = result.query.toLowerCase();
  const text = `${result.title} ${result.extract}`.toLowerCase();
  if (/日记|diary|diaries/.test(title)) return "diary_note";
  if (/书信|letter|letters|correspondence|函/.test(title)) return "work_note";
  if (/日记|diary|diaries/.test(query) && /日记|diary|diaries/.test(text)) return "diary_note";
  if (/文集|诗|词|works|wikisource|source text|文章|essay/.test(text)) return "work_note";
  if (/传记|biography|wikipedia|年谱|自传|autobiography/.test(text)) return "biographical_fact";
  return "paraphrase";
}

function inferConfidence(result: ExtractResult) {
  if (result.project === "wikipedia") return 0.72;
  if (/日记|书信|文集|诗|词|letters|diary|works/i.test(`${result.title} ${result.query}`)) return 0.76;
  return 0.66;
}

function chunkFromResult(person: PersonaProfile, result: ExtractResult): PersonaMemoryChunk {
  const sourceLabel = `${result.lang}.${result.project}: ${result.title}`;
  return {
    id: `web-${person.id}-${hash(`${sourceLabel}:${result.query}`)}`,
    personId: person.id,
    title: result.title,
    sourceId: result.url,
    sourceLabel,
    kind: inferKind(result),
    content: result.extract,
    tags: [...person.suitableFor, "voice", "turning_point"],
    confidenceScore: inferConfidence(result),
    isDirectQuote: false,
    caveat: "联网抓取的是公开页面摘要/片段，只作为角色RAG上下文；不要当作逐字引文。"
  };
}

function rankWebChunks(chunks: PersonaMemoryChunk[], analysis?: MoodAnalysis) {
  if (!analysis) return chunks;
  const wanted = new Set<string>([...analysis.emotionTags, ...analysis.behaviorTags]);
  const raw = analysis.rawInput;

  return chunks
    .map((chunk) => {
      const tagScore = chunk.tags.filter((tag) => wanted.has(tag)).length / Math.max(chunk.tags.length, 1);
      const queryScore =
        /(懒|不想干|摆烂|拖延|废)/.test(raw) && /(日记|反省|学习|work|diary|letters|自省|行动)/i.test(chunk.content)
          ? 0.18
          : 0;
      return { chunk, score: 0.58 * tagScore + 0.28 * chunk.confidenceScore + queryScore };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ chunk }) => chunk);
}

export async function fetchWebRagChunks(person: PersonaProfile, limit = 6, analysis?: MoodAnalysis) {
  const cacheKey = `${person.id}:${limit}`;
  const cached = webChunkCache.get(cacheKey);
  if (cached) return rankWebChunks(cached, analysis).slice(0, limit);

  const searches = await Promise.allSettled(
    personQueries(person).map(async (query) => {
      const results = await mediaWikiSearch(query.project, query.lang, query.query, query.limit);
      return results.slice(0, query.limit).map((item) => ({ ...query, title: item.title, snippet: stripHtml(item.snippet) }));
    })
  );

  const extractJobs = searches
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((item) => item.title && !/消歧义|disambiguation/i.test(item.title))
    .slice(0, 10)
    .map((item) => mediaWikiExtract(item.project, item.lang, item.title, item.query));

  const [extracts, libraryChunks, wikiSummaryChunk] = await Promise.all([
    Promise.allSettled(extractJobs),
    fetchOpenLibraryChunks(person, 3),
    fetchWikiSummaryChunk(person)
  ]);
  const deduped = new Map<string, PersonaMemoryChunk>();

  for (const result of extracts) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const chunk = chunkFromResult(person, result.value);
    const key = `${chunk.sourceLabel}:${chunk.content.slice(0, 80)}`;
    if (!deduped.has(key)) deduped.set(key, chunk);
  }

  for (const chunk of [wikiSummaryChunk, ...libraryChunks]) {
    if (!chunk) continue;
    const key = `${chunk.sourceLabel}:${chunk.title}`;
    if (!deduped.has(key)) deduped.set(key, chunk);
  }

  const chunks = Array.from(deduped.values()).slice(0, Math.max(limit, 6));
  webChunkCache.set(cacheKey, chunks);
  return rankWebChunks(chunks, analysis).slice(0, limit);
}

export async function retrieveWebContextsForPeople(
  peopleToRetrieve: PersonaProfile[],
  analysis: MoodAnalysis,
  limitPerPerson = 4
) {
  if (!isWebRagEnabled() || peopleToRetrieve.length === 0) {
    return {} as Record<string, PersonaMemoryChunk[]>;
  }

  const settled = await Promise.allSettled(
    peopleToRetrieve.map(async (person) => [person.id, await fetchWebRagChunks(person, limitPerPerson, analysis)] as const)
  );

  return Object.fromEntries(
    settled
      .filter((item): item is PromiseFulfilledResult<readonly [string, PersonaMemoryChunk[]]> => item.status === "fulfilled")
      .map((item) => item.value)
  ) as Record<string, PersonaMemoryChunk[]>;
}

export function webRagEnabled() {
  return isWebRagEnabled();
}
