import type { PersonaProfile, SourceItem } from "@/lib/types";

async function fetchWithTimeout(url: string, timeoutMs = 2500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SageMatch hackathon demo" },
      next: { revalidate: 60 * 60 * 24 }
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWikipediaSummary(title: string, lang: "zh" | "en") {
  try {
    if (lang === "zh") {
      const params = new URLSearchParams({
        action: "query",
        prop: "extracts",
        exintro: "1",
        explaintext: "1",
        format: "json",
        titles: title,
        origin: "*"
      });
      const response = await fetchWithTimeout(`https://zh.wikipedia.org/w/api.php?${params.toString()}`);
      if (!response.ok) return null;
      const data = (await response.json()) as {
        query?: { pages?: Record<string, { extract?: string; fullurl?: string }> };
      };
      const page = Object.values(data.query?.pages ?? {})[0];
      const extract = page?.extract?.slice(0, 260);
      if (!extract) return null;
      return { extract, url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}` };
    }

    const response = await fetchWithTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
    if (!data.extract) return null;
    return {
      extract: data.extract.slice(0, 260),
      url: data.content_urls?.desktop?.page
    };
  } catch {
    return null;
  }
}

export async function fetchWikiSummary(person: PersonaProfile): Promise<SourceItem | null> {
  const zh = await fetchWikipediaSummary(person.nameZh, "zh");
  const summary = zh ?? (await fetchWikipediaSummary(person.nameEn, "en"));
  if (!summary) return null;

  return {
    id: `wiki-${person.id}`,
    title: `${person.nameZh} Wikipedia 摘要`,
    url: summary.url,
    sourceType: "wikipedia",
    note: `联网补充：${summary.extract}`
  };
}
