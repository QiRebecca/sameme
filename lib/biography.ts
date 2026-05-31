import { z } from "zod";
import { maybeGenerateImage } from "@/lib/image-generation";
import { generateJsonWithLLM } from "@/lib/llm";
import { people } from "@/lib/seed-people";
import type { BiographyEntry, DialogueMessage, PersonaProfile } from "@/lib/types";

export const biographyDisclaimer =
  "此传为基于本次群聊与公开人物风格生成的拟态小传，不代表历史人物真实记录或原话。";

const generatedBiographySchema = z.object({
  title: z.string().min(1).max(48),
  chroniclerName: z.string().min(1).max(24),
  chroniclerStyle: z.string().min(1).max(40),
  body: z.string().min(20).max(900),
  illustrationPrompt: z.string().min(8).max(420).optional(),
  comments: z
    .array(
      z.object({
        personId: z.string(),
        content: z.string().min(4).max(320)
      })
    )
    .max(6)
    .default([])
});

function compactMessages(messages: DialogueMessage[]) {
  return messages
    .filter((message) => message.type === "user" || message.type === "persona")
    .slice(-18)
    .map((message) => ({
      speaker: message.speakerName,
      role: message.role,
      type: message.type,
      content: message.content.slice(0, 420)
    }));
}

function findPeople(personIds: string[]) {
  const requested = personIds
    .map((id) => people.find((person) => person.id === id))
    .filter(Boolean) as PersonaProfile[];
  if (requested.length) return requested;

  const defaults = ["su_shi", "hu_shi", "wang_yangming"]
    .map((id) => people.find((person) => person.id === id))
    .filter(Boolean) as PersonaProfile[];
  return defaults;
}

function todayZh(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function fallbackBiography({
  sessionId,
  date,
  messages,
  participants
}: {
  sessionId: string;
  date: string;
  messages: DialogueMessage[];
  participants: PersonaProfile[];
}): BiographyEntry {
  const userMessages = messages.filter((message) => message.type === "user");
  const firstUserText = userMessages[0]?.content ?? "有烦恼未名";
  const lastUserText = userMessages[userMessages.length - 1]?.content ?? firstUserText;
  const names = participants.map((person) => person.nameZh).join("、") || "诸贤";
  const primary = participants[0] ?? people[0];
  const now = new Date().toISOString();

  return {
    id: `bio-${sessionId}-${date}-${Date.now()}`,
    sessionId,
    date,
    title: `${todayZh(date)}小传`,
    chroniclerName: "群聊史官",
    chroniclerStyle: "半史书半群聊",
    body: `${todayZh(date)}，小友入群，言曰：“${firstUserText.slice(0, 42)}”。其后又问：“${lastUserText.slice(0, 42)}”。遂召${names}共坐一席。诸人各以旧事照今事，不作判词，只把难处摊在灯下。此日所记，不过一段低声的“俺也一样”：人未必立刻得解，然已不独自困在原地。`,
    illustrationUrl: undefined,
    illustrationPrompt: `丰子恺式简淡漫画插图：${firstUserText.slice(0, 60)}，一页旧书旁的小人物/小动物，温柔幽默，毛笔线条，少色块，大留白，不写实脸部。`,
    participants: participants.map((person) => ({
      personId: person.id,
      nameZh: person.nameZh,
      avatarEmoji: person.avatarEmoji,
      role: person.roleInCouncil
    })),
    comments: [
      {
        id: `bio-comment-${primary.id}-${Date.now()}`,
        personId: primary.id,
        speakerName: primary.nameZh,
        speakerEmoji: primary.avatarEmoji,
        role: primary.roleInCouncil,
        content: `${primary.nameZh}按：此事我不敢替你下结论。只是旧日我也有低处，知道人被卡住时，最怕无人听见。今日既已说出，便不是全无转机。`,
        layer: "dramatization"
      }
    ],
    createdAt: now,
    updatedAt: now,
    disclaimer: biographyDisclaimer
  };
}

export async function generateBiographyEntry({
  sessionId,
  date,
  messages,
  personIds
}: {
  sessionId: string;
  date: string;
  messages: DialogueMessage[];
  personIds: string[];
}): Promise<BiographyEntry> {
  const participants = findPeople(personIds);
  const fallback = fallbackBiography({ sessionId, date, messages, participants });
  const generated = await generateJsonWithLLM(
    [
      "你是“俺也一样”的群聊史官 agent。",
      "任务：根据当天真实群聊记录，写一则短短的小传，像做旧史书页上的当日记事。",
      "风格：文白夹杂、诙谐、有人味，像“某日，小友职场遇挫，遂召苏轼等入群共议”。",
      "必须基于聊天记录，不要编造用户没有说过的严重事件。可以轻微戏剧化，但不能说成事实证据。",
      "不能编造历史人物直接引语。所有名人评论都是拟态演绎。",
      "参与的名人可以按性格选择是否评论；不是每个人都必须评论。评论要像群聊页下面的短评，不要鸡汤，不要布置任务。",
      "同时给出 illustrationPrompt：用于生成左页插图。画面要像丰子恺式简淡漫画：毛笔线条、稚拙温柔、少量淡彩、大留白、旧纸质感。可以把用户状态转成隐喻物，例如懒猫、躺着的小人、江边小舟、案头书卷；不要出现真实历史人物肖像。",
      "如果提人物经历，只能用概括性事实边界，例如苏轼贬谪、黄州生活重建；胡适日记材料只可概括，不可伪造原句。",
      "只返回 JSON。"
    ].join("\n"),
    JSON.stringify({
      date,
      dateZh: todayZh(date),
      chatMessages: compactMessages(messages),
      participants: participants.map((person) => ({
        id: person.id,
        nameZh: person.nameZh,
        role: person.roleInCouncil,
        voiceStyle: person.speechStylePrompt ?? person.voiceStyle,
        humorStyle: person.humorStyle,
        knownStages: person.lifeEvents.map((event) => ({
          title: event.title,
          factualBasis: event.factualBasis,
          caveat: event.caveat
        }))
      })),
      outputShape:
        "{ title, chroniclerName, chroniclerStyle, body, illustrationPrompt, comments: [{ personId, content }] }"
    }),
    {
      title: fallback.title,
      chroniclerName: fallback.chroniclerName,
      chroniclerStyle: fallback.chroniclerStyle,
      body: fallback.body,
      illustrationPrompt: fallback.illustrationPrompt,
      comments: fallback.comments.map((comment) => ({ personId: comment.personId, content: comment.content }))
    },
    { temperature: 0.72, maxTokens: 1100, timeoutMs: 18000 }
  );

  const parsed = generatedBiographySchema.safeParse(generated);
  if (!parsed.success) {
    const illustration = await maybeGenerateImage(
      `${fallback.illustrationPrompt}. Style: Feng Zikai-inspired simple Chinese ink cartoon, childlike brush lines, sparse composition, warm old paper, humorous but gentle, no text.`,
      fallback.body,
      12000
    );
    return { ...fallback, illustrationUrl: illustration.imageUrl };
  }
  const now = new Date().toISOString();
  const commentPeople = new Map(participants.map((person) => [person.id, person]));
  const illustrationPrompt =
    parsed.data.illustrationPrompt ??
    `丰子恺式简淡漫画插图：${parsed.data.title}。旧纸、毛笔线条、淡彩、大留白，不画真实历史人物肖像。`;
  const illustration = await maybeGenerateImage(
    `${illustrationPrompt}. Style: Feng Zikai-inspired simple Chinese ink cartoon, childlike brush lines, sparse composition, warm old paper, gentle humor, no text, no realistic portrait, compact composition for left page of a book.`,
    `${parsed.data.body} ${parsed.data.title}`,
    16000
  );

  return {
    id: `bio-${sessionId}-${date}-${Date.now()}`,
    sessionId,
    date,
    title: parsed.data.title,
    chroniclerName: parsed.data.chroniclerName,
    chroniclerStyle: parsed.data.chroniclerStyle,
    body: parsed.data.body,
    illustrationUrl: illustration.imageUrl,
    illustrationPrompt,
    participants: participants.map((person) => ({
      personId: person.id,
      nameZh: person.nameZh,
      avatarEmoji: person.avatarEmoji,
      role: person.roleInCouncil
    })),
    comments: parsed.data.comments
      .map((comment, index) => {
        const person = commentPeople.get(comment.personId);
        if (!person) return null;
        return {
          id: `bio-comment-${person.id}-${Date.now()}-${index}`,
          personId: person.id,
          speakerName: person.nameZh,
          speakerEmoji: person.avatarEmoji,
          role: person.roleInCouncil,
          content: comment.content,
          layer: "dramatization" as const
        };
      })
      .filter(Boolean) as BiographyEntry["comments"],
    createdAt: now,
    updatedAt: now,
    disclaimer: biographyDisclaimer
  };
}
