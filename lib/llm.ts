type LlmJsonOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  model?: string;
};

export async function generateJsonWithLLM<T>(
  systemPrompt: string,
  prompt: string,
  fallback: T,
  options: LlmJsonOptions = {}
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://tokendance.space/gateway/v1").replace(/\/$/, "");
  const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.5";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 18000);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 900,
        response_format: { type: "json_object" }
      })
    });
    clearTimeout(timeout);

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[llm] non-ok response", response.status, await response.text());
      }
      return fallback;
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      if (process.env.NODE_ENV !== "production") console.warn("[llm] empty content");
      return fallback;
    }
    const normalized = content
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(normalized) as T;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[llm] fallback", error);
    return fallback;
  }
}

export async function maybeGenerateWithLLM<T>(prompt: string, fallback: T): Promise<T> {
  return generateJsonWithLLM(
    "你是“俺也一样”的历史人物群聊编剧。只返回严格 JSON。像微信群短聊，不像心理咨询，也不像传记解说。每个 persona 要有具体生平、口气和关系张力，但每条只说 1-3 个短句。可以顺手提一句自己当年的相似处境，不要展开成小作文，不要给用户上课。严禁编造历史人物原话；严禁写“我在日记里写过/我曾说过/原话是”；胡适打牌素材只能概括为日记材料里有打牌、学习、上课、自我约束等记录。所有 persona 话术都是拟态演绎；不要在用户可见内容里说 RAG、memory、context、资料显示。不要让每个人都给任务或行动建议；除非用户明确要行动建议，不要写翻一页、打开文档、写一句、写一行、做五分钟这类微任务。不要为了覆盖人物而让所有人发言；先判断谁有话说。角色可以互相回复、吐槽、拆台，也可以沉默。",
    prompt,
    fallback,
    { temperature: 0.7, maxTokens: 900, timeoutMs: 18000 }
  );
}
