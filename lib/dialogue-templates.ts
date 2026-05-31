import { getPersonById, people } from "@/lib/seed-people";
import { parseMood } from "@/lib/mood-parser";
import { retrieveContextsForPeople, retrievePersonaContext } from "@/lib/persona-rag";
import { retrieveWebContextsForPeople } from "@/lib/web-rag";
import type { ActionPlan, DialogueMessage, DialogueMode, PersonaMemoryChunk, PersonaProfile } from "@/lib/types";
import { maybeGenerateWithLLM } from "@/lib/llm";
import { z } from "zod";

export const dramatizationDisclaimer = "以下为基于公开资料和人物风格生成的角色演绎，不代表历史人物真实言论。";

export function createActionPlan(): ActionPlan {
  return {
    title: "5 分钟开场动作",
    durationMinutes: 10,
    steps: [
      "先停一下，不继续骂自己",
      "喝口水或换个坐姿",
      "在群里说清楚：现在最卡的是哪一块",
      "听一轮先贤互相拆台",
      "再决定要不要行动"
    ],
    completionText: "不用立刻变自律，先把这轮话聊完。"
  };
}

function message(
  id: string,
  person: Pick<PersonaProfile, "id" | "nameZh" | "avatarEmoji" | "roleInCouncil">,
  content: string
): DialogueMessage {
  return {
    id,
    speakerId: person.id,
    speakerName: person.nameZh,
    speakerEmoji: person.avatarEmoji,
    role: person.roleInCouncil,
    content,
    type: "persona",
    layer: "dramatization"
  };
}

function system(id: string, content: string): DialogueMessage {
  return {
    id,
    speakerId: "system",
    speakerName: "群聊系统",
    speakerEmoji: "🔔",
    role: "入群提醒",
    content,
    type: "system",
    layer: "dramatization"
  };
}

function hasContext(contexts: PersonaMemoryChunk[], pattern: RegExp) {
  return contexts.some((context) => pattern.test(`${context.title} ${context.content}`));
}

function personaVoiceDirective(person: PersonaProfile) {
  const directives: Record<string, string> = {
    hu_shi:
      "胡适声线：现代白话，像在写一则短短的日记批注或给朋友回信；爱把情绪问题改成“小实验/小考据”；温和自嘲，不端架子；可以轻轻吐槽自己也会摸鱼；不要古风。",
    su_shi:
      "苏轼声线：旷达、馋、会过日子；把挫折说成厨房、江边、黄州、热汤、东坡肉一类生活画面；幽默化解沉重，但不鸡汤；像一个会把你拉去吃饭的低谷朋友。",
    wang_yangming:
      "王阳明声线：短句、准、像教练；少解释，多下令；会温和但强硬地把人从脑内剧场拎到手上动作；可以说“不必”“现在”“先做”；不要抒情。",
    zhuangzi:
      "庄子声线：怪、轻、反问多，像拿蝴蝶、树、鱼、风讲一个歪理但忽然有用；专门拆“我必须有用”的绳子；不催太狠，会给行动松绑。",
    lu_xun:
      "鲁迅声线：冷幽默、短促、锋利但护短；怼的是用户脑内审判官和假鸡血，不羞辱用户；句子像小刀，最后递一块创可贴。",
    mao_zedong:
      "毛泽东声线：沉稳、战略视角、大局感；只做心理安定与行动拆局，不输出政治立场；把烦恼说成局面、主要矛盾、小胜利。",
    li_bai:
      "李白声线：潇洒、夸张、爱把小事说得像月亮和酒；负责把用户从灰里捞出来，允许一点浪漫和胡闹。",
    du_fu:
      "杜甫声线：现实、沉着、看见具体困境；不浮夸，像在乱世里仍然替人收拾一张桌子；温厚但有重量。",
    cao_cao:
      "曹操声线：嘴硬、现实主义、看资源和胜算；可以有一点不客气，但要帮用户拿回控制感。",
    zhuge_liang:
      "诸葛亮声线：军师拆解型；把雾一样的大任务拆成三格；语气克制、清楚、有步骤。"
  };

  return directives[person.id] ?? `角色声线：${person.speechStylePrompt ?? person.voiceStyle}；幽默方式：${person.humorStyle}。必须和其他角色有明显区别。`;
}

function personaReply(person: PersonaProfile, input: string, contexts: PersonaMemoryChunk[]) {
  const mentionsProblemMethod = hasContext(contexts, /說難|困难|專門|问题|学术|方法|證|证/);
  const mentionsLetter = hasContext(contexts, /致|函|书信|劝慰|先生/);
  const mentionsBiography = hasContext(contexts, /新文化|實用主義|实用主义|大膽|假設|实证|考据|白话/);

  const lines: Record<string, string> = {
    hu_shi: [
      mentionsProblemMethod
        ? "俺也一样。我这类人最擅长：计划写得端端正正，手已经想去摸牌。"
        : "俺也一样。理性在桌上坐着，手在旁边想摸鱼。",
      mentionsLetter
        ? "不过我后来发现，骂自己没什么用，顶多骂出一篇很难看的日记。"
        : mentionsBiography
          ? "所以我一般先不判案：今天是真的废，还是只是电量低？这个要查证。"
          : "难看是难看，但难看也可以先记账。",
      "最后也没变成圣人，只是明天厚着脸皮再来一次。"
    ].join(""),
    su_shi: [
      "别干了，我锅都热了。",
      "我在黄州那会儿也很狼狈，官没得做，脸也没处搁，最后只能先把日子煮熟。",
      "你来吃两口，天大的事，等肉烂了再说。阳明兄先别拔剑，锅盖会飞。"
    ].join(""),
    wang_yangming: [
      "苏子，你先煮。用户先吃。",
      "但吃完还说“我懂了所以我不动”，那就不行。",
      "我在龙场也不是靠想通活下来的，想通要落到身上，不然只是脑内摆摊。"
    ].join(""),
    zhuangzi: "不想干活，很正常。鱼也不想上岸，树也不想述职。你若只是今天不想当个“有用的人”，那就先别急着把自己判成废木头。",
    mao_zedong: "这叫局面不顺，不叫全盘皆输。先别把小疲惫看成大战役。人稳住，局面才有得看。",
    lu_xun: "不想干活是人之常情。可笑的是脑内那位监工，自己一件事不做，专门骂你。建议先把他开除。",
    li_bai: "不干便不干，先把月亮叫来陪坐一会儿。人生不顺时，我也常靠一点酒气撑门面，后来大家竟说我潇洒。",
    du_fu: "我懂那种动不了。不是诗意，是穷、乱、累都压在身上。人到那时，先别说大志，能把苦处说出来，已经不容易。",
    xin_qiji: "我最烦的不是累，是想冲出去却被按住。那股劲无处使，就在心里敲铁。你这句不想干，里面也许有一点被困住的火。",
    li_qingzhao: "我有时也不是不想做，是心里太乱，手就冷了。后来能留下来的，不是什么完美办法，只是把那点冷清收成几行字。",
    sima_qian: "我后来还能写，是因为有些话不写完，人就只剩伤口。你现在不想动，倒像是伤口先说了话。",
    cao_cao: "不想干活？先别装忠臣良将。兵饿了就是饿了，粮草空了还喊冲锋，那才是真败家。",
    zhuge_liang: "我不劝你立刻雄起。很多局不是输在懒，是输在看不清。雾太大时，军师也得先闭嘴看地图。",
    qu_yuan: "我不是不想做事，是想守的东西没人听。那种无力，像站在深水边。你这句不想干，也许不是懒，是心里有水声。",
    liang_qichao: "我年轻时常觉得天下事都催着我跑，跑久了也会喘。热血不是永动机，热血也会累得想躺平。",
    confucius: "我也有讲了半天没人用的时候。尴尬，很尴尬。但人生有时就是这样：道理坐冷板凳，人也坐冷板凳。",
    mencius: "我游说诸侯，也常碰壁。别人不买账时，我也很想翻白眼。只是那口气不能塌，塌了就真被他们说中了。"
  };

  return lines[person.id] ?? `${person.personaTagline}。我听见的是：“${input}”。先别把自己推远，做一个小到不会失败的动作。`;
}

function compactContextForPrompt(chunks: PersonaMemoryChunk[], maxItems = 3) {
  return chunks
    .slice(0, maxItems)
    .map((item, index) => {
      const quoteFlag = item.isDirectQuote ? "direct_quote" : "summary";
      return `${index + 1}. [${item.kind}/${quoteFlag}] ${item.title}：${item.content.slice(0, 260)}${item.content.length > 260 ? "..." : ""}${item.caveat ? ` Caveat：${item.caveat}` : ""}`;
    })
    .join("\n");
}

function compactContextObjects(chunks: PersonaMemoryChunk[]) {
  return chunks.slice(0, 3).map((chunk) => ({
    title: chunk.title,
    sourceLabel: chunk.sourceLabel,
    kind: chunk.kind,
    confidenceScore: chunk.confidenceScore,
    content: `${chunk.content.slice(0, 260)}${chunk.content.length > 260 ? "..." : ""}`,
    caveat: chunk.caveat
  }));
}

export function buildPersonaMetaPrompt(person: PersonaProfile, contexts: PersonaMemoryChunk[] = []) {
  const grounding = contexts.length ? contexts : retrievePersonaContext(person, parseMood("我好懒真的不想干了"));
  return [
    `你正在扮演历史 persona：${person.nameZh}（${person.era}，${person.identity.join("、")}）。`,
    `Private memory brief：${person.memoryBrief}`,
    `性格：${person.personality?.join("、") ?? person.voiceStyle}`,
    `说话风格：${person.speechStylePrompt ?? person.voiceStyle}`,
    `角色声线说明：${personaVoiceDirective(person)}`,
    `群聊倾向：${person.debateTendency ?? "只在自己的经历能帮助用户时发言。"}`,
    `关系提示：${person.relationshipHints?.join("；") || "无"}`,
    `Private grounding notes：\n${compactContextForPrompt(grounding)}`,
    "硬规则：不要编造或冒充历史人物原话；不要声称自己就是历史本人；所有内容都是拟态演绎；不要在用户可见发言里说“RAG”“memory”“检索到的 context”“资料显示”等后台词。",
    "目标：像微信群里真人闲聊。短句、接梗、互相吐槽；可以顺手提一句自己的相似经历，但不要展开成小传。少给建议，不要说教。"
  ].join("\n");
}

function mergeContexts(local: PersonaMemoryChunk[], web: PersonaMemoryChunk[], limit = 6) {
  const deduped = new Map<string, PersonaMemoryChunk>();

  for (const chunk of [...web, ...local]) {
    const key = `${chunk.personId}:${chunk.sourceLabel}:${chunk.title}`;
    if (!deduped.has(key)) deduped.set(key, chunk);
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, limit);
}

export function deterministicDialogue(
  input: string,
  mode: DialogueMode,
  personIds: string[],
  providedContextMap?: Record<string, PersonaMemoryChunk[]>,
  history: DialogueMessage[] = []
): {
  messages: DialogueMessage[];
  actionPlan: ActionPlan;
} {
  const actionPlan = createActionPlan();
  const analysis = parseMood(input);
  const selected = personIds.map(getPersonById).filter(Boolean) as PersonaProfile[];
  const primary = selected[0] ?? people[0];

  const userMessage: DialogueMessage = {
    id: "user-1",
    speakerId: "user",
    speakerName: "你",
    speakerEmoji: "🫠",
    role: "当代摆烂现场",
    content: input,
    type: "user"
  };

  if (mode === "tiny_action") {
    return {
      actionPlan,
      messages: [
        userMessage,
        system("tiny-1", "已切换到小行动模式。")
      ]
    };
  }

  if (mode === "one_on_one") {
    const contextMap = providedContextMap ?? retrieveContextsForPeople([primary], analysis, 2);
    return {
      actionPlan,
      messages: [
        userMessage,
        message("one-1", primary, personaReply(primary, input, contextMap[primary.id] ?? [])),
        message("one-2", primary, "今天别急着把人生翻新。你先说说，卡住你的到底是累、烦、怕，还是单纯不想搭理这个世界？")
      ]
    };
  }

  const group = selected.length > 0 ? selected : [
    getPersonById("hu_shi")!,
    getPersonById("su_shi")!,
    getPersonById("wang_yangming")!,
    getPersonById("zhuangzi")!
  ];
  const activeGroup = selectSpeakers(group.slice(0, 6), input, history);
  const contextMap = providedContextMap ?? retrieveContextsForPeople(activeGroup, analysis, 2);

  return {
    actionPlan,
    messages: [
      userMessage,
      ...activeGroup.map((person, index) => message(`group-${index + 1}`, person, personaReply(person, input, contextMap[person.id] ?? [])))
    ].slice(0, 14)
  };
}

function selectSpeakers(group: PersonaProfile[], input: string, history: DialogueMessage[] = []) {
  if (group.length <= 1) return group;

  const personaTurns = history.filter((message) => message.type === "persona");
  const firstRound = personaTurns.length === 0;
  const mentioned = group.find((person) => input.includes(`@${person.nameZh}`) || input.includes(person.nameZh));
  const desiredSpeakers = firstRound
    ? Math.min(group.length, mentioned ? 1 : /(大家|都|群里|怎么看|讨论|一起)/.test(input) ? 4 : 3)
    : Math.min(group.length, mentioned ? 1 : /(大家|都|群里|怎么看|吵|讨论|你们)/.test(input) ? 4 : 2);
  const byId = new Map(group.map((person) => [person.id, person]));
  const picked: PersonaProfile[] = [];
  const add = (id: string) => {
    const person = byId.get(id);
    if (person && !picked.includes(person)) picked.push(person);
  };
  if (mentioned) add(mentioned.id);

  if (firstRound) {
    if (/(懒|不想干|摆烂|躺|废)/.test(input)) {
      add("hu_shi");
      add(byId.has("su_shi") ? "su_shi" : "zhuangzi");
      if (/(烦|骂|审判|废)/.test(input) && byId.has("lu_xun")) add("lu_xun");
    } else {
      add(group[0].id);
      if (group.length > 2) add(group[1].id);
    }
    for (const person of group) {
      if (picked.length >= desiredSpeakers) break;
      add(person.id);
    }
  } else {
    const lastSpeakerId = personaTurns.at(-1)?.speakerId;
    const start = Math.max(0, group.findIndex((person) => person.id === lastSpeakerId) + 1);
    const rotated = [...group.slice(start), ...group.slice(0, start)];

    if (/(做|开始|行动|动|拖延)/.test(input)) add("wang_yangming");
    if (/(累|难受|崩|烦|撑不住|低落)/.test(input)) add(byId.has("su_shi") ? "su_shi" : "zhuangzi");
    if (/(骂|老板|讨厌|傻|烦死|破防)/.test(input)) add("lu_xun");

    for (const person of rotated) {
      if (person.id !== lastSpeakerId) add(person.id);
      if (picked.length >= desiredSpeakers) break;
    }
  }

  return (picked.length ? picked : group).slice(0, desiredSpeakers);
}

export async function generateDialogue(input: string, mode: DialogueMode, personIds: string[], history: DialogueMessage[] = []) {
  const analysis = parseMood(input);
  const selected = personIds.map(getPersonById).filter(Boolean) as PersonaProfile[];
  const defaultCouncil = ["hu_shi", "su_shi", "wang_yangming", "zhuangzi"]
    .map(getPersonById)
    .filter(Boolean) as PersonaProfile[];
  const activeSelected = selected.length ? selected : mode === "group_chat" ? defaultCouncil : [people[0]];
  const localContextMap = retrieveContextsForPeople(activeSelected, analysis, 3);
  const webContextMap = await retrieveWebContextsForPeople(activeSelected, analysis, 4);
  const contextMap = Object.fromEntries(
    activeSelected.map((person) => [
      person.id,
      mergeContexts(localContextMap[person.id] ?? [], webContextMap[person.id] ?? [], 6)
    ])
  ) as Record<string, PersonaMemoryChunk[]>;
  const fallback = deterministicDialogue(input, mode, personIds, contextMap, history);
  const recentHistory = history
    .filter((message) => message.type === "user" || message.type === "persona")
    .slice(-8)
    .map((message) => ({
      speakerId: message.speakerId,
      speakerName: message.speakerName,
      role: message.role,
      type: message.type,
      content: message.content.slice(0, 220)
    }));

  const prompt = JSON.stringify({
    input,
    mode,
    recentHistory,
    speakerPolicy: [
      "如果用户 @某位名人，优先让这位名人回答；其他人只有确实想插话才说。",
      "先判断谁真的有话说，不要为了展示角色而让每个人出声。",
      "如果上一条 persona 已经说得够好，本轮可以只让另一个人接一句。",
      "角色可以直接回复其他角色，例如“苏子这锅我先不动”“胡先生又开始记账了”。",
      "角色可以偶尔以文字形式拍一拍用户，例如“苏轼拍了拍你，递来一碗热汤”，但不要频繁使用。",
      "除非用户问“大家/你们怎么看”，否则通常 1 条或 2 条就够；问大家时可以更多。"
    ],
    task:
      "生成历史人物拟态群聊。像微信群，不像心理咨询，也不像传记解说。只让 selectedPersonas 里的角色按场景自然说话；不要主持人；不要说 RAG/memory/context/资料显示；不要伪造原话；不要写“我在日记里写过/我曾说过/原话是”。胡适打牌素材只能概括，不能假装引用日记。不要机械地让所有人排队回复；可以有人沉默。角色可以说“俺也一样”“别干了来吃饭”这类短句；可以顺手带出自己的相似经历，但每条最多 1 个经历点，不要展开成小作文。重点允许角色互相接话、拆台、反驳、调侃，不要每句话都直接回用户。除非用户明确要行动建议，否则不要写“翻一页/打开文档/写一句/写一行/做五分钟”这类微任务。强制要求：每个人的句式、节奏、比喻系统、幽默方式必须明显不同；禁止所有角色都说同一种温柔心理咨询腔。",
    selectedPersonas: activeSelected.map((person) => ({
      id: person.id,
      nameZh: person.nameZh,
      role: person.roleInCouncil,
      voiceStyle: person.voiceStyle,
      humorStyle: person.humorStyle,
      speechRules: person.speechStylePrompt ?? person.voiceStyle,
      voiceDirective: personaVoiceDirective(person),
      debateTendency: person.debateTendency,
      privateGrounding: compactContextObjects(contextMap[person.id] ?? []).slice(0, 2),
      caveat: person.lifeEvents[0]?.caveat ?? "所有发言都是拟态演绎，不代表历史人物真实言论。"
    })),
    requiredShape:
      "Return { messages: DialogueMessage[], actionPlan: ActionPlan }. DialogueMessage requires id, speakerId, speakerName, speakerEmoji, role, content, type, layer. messages length should fit the scene: 1 to selectedPersonas.length, but do not use all speakers unless the user asks the group. Only selected personas may speak; no host/主持人. Personas may reply to each other; content may mention another persona by name. Each message should be 1-3 short sentences. Do not write generic therapy language. Keep messages concise and do not expose backend grounding words."
  });

  const generated = await maybeGenerateWithLLM<unknown>(prompt, fallback);
  const parsed = dialogueResultSchema.safeParse(generated);
  if (parsed.success && !hasBadPersonaContent(parsed.data.messages, input)) {
    return {
      ...parsed.data,
      messages: parsed.data.messages
        .filter((message) => message.type === "persona")
        .slice(0, activeSelected.length)
    };
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[dialogue] llm fallback",
      parsed.success ? "unsafe or tasky persona content" : parsed.error.flatten().fieldErrors,
      JSON.stringify(generated).slice(0, 800)
    );
  }
  const normalized = normalizeGeneratedDialogue(generated, fallback, activeSelected);
  return hasBadPersonaContent(normalized.messages, input) ? fallback : normalized;
}

function hasUnsafeQuoteClaims(messages: DialogueMessage[]) {
  return messages.some((message) =>
    /(我.*日记.*写|日记里写|日记里都是|日记.*都是打牌|我曾说|我曾写|原话|亲口说|名言是|今日打牌，明日上课)/.test(message.content)
  );
}

function hasBadPersonaContent(messages: DialogueMessage[], input: string) {
  const userAskedForAction = /(怎么做|怎么办|行动|任务|建议|复活|计划|下一步)/.test(input);
  return messages.some((message) => {
    if (hasUnsafeQuoteClaims([message])) return true;
    if (userAskedForAction) return false;
    return /(翻一页|打开文档|打开页面|页面打开|把笔拿起来|笔拿起来|写一句|写一行|写两行|做五分钟|做5分钟|五分钟)/.test(message.content);
  });
}

function normalizeGeneratedDialogue(
  generated: unknown,
  fallback: { messages: DialogueMessage[]; actionPlan: ActionPlan },
  activeSelected: PersonaProfile[]
) {
  const raw = generated as { messages?: unknown; actionPlan?: unknown };
  if (!Array.isArray(raw?.messages)) return fallback;

  const peopleById = new Map(activeSelected.map((person) => [person.id, person]));
  const peopleByName = new Map(activeSelected.map((person) => [person.nameZh, person]));
  const normalized = raw.messages
    .map((item, index) => {
      const messageLike = item as Partial<DialogueMessage>;
      const speakerName = String(messageLike.speakerName ?? "");
      const person =
        peopleById.get(String(messageLike.speakerId ?? "")) ??
        peopleByName.get(speakerName) ??
        activeSelected.find((profile) => speakerName.includes(profile.nameZh) || profile.nameZh.includes(speakerName));
      const content = typeof messageLike.content === "string" ? messageLike.content.trim() : "";

      if (!person || !content) return null;
      return message(`llm-${person.id}-${index}`, person, content.slice(0, 520));
    })
    .filter(Boolean) as DialogueMessage[];

  return {
    messages: normalized.length ? normalized : fallback.messages,
    actionPlan: actionPlanSchema.safeParse(raw.actionPlan).success
      ? (raw.actionPlan as ActionPlan)
      : fallback.actionPlan
  };
}

const dialogueMessageSchema = z.object({
  id: z.string(),
  speakerId: z.string(),
  speakerName: z.string(),
  speakerEmoji: z.string(),
  role: z.string(),
  content: z.string().min(1).max(700),
  type: z.enum(["user", "persona", "host", "system"]),
  layer: z.enum(["fact", "analogy", "dramatization"]).optional(),
  effect: z.enum(["pat"]).optional(),
  targetSpeakerId: z.string().optional(),
  targetSpeakerName: z.string().optional()
});

const actionPlanSchema = z.object({
  title: z.string(),
  durationMinutes: z.number().min(1).max(10),
  steps: z.array(z.string()).min(3).max(8),
  completionText: z.string()
});

const dialogueResultSchema = z.object({
  messages: z.array(dialogueMessageSchema).min(1).max(12),
  actionPlan: actionPlanSchema
});
