import { people } from "@/lib/seed-people";
import type { MoodAnalysis, PersonaMemoryChunk, PersonaProfile } from "@/lib/types";

type MemorySeed = Omit<PersonaMemoryChunk, "id" | "personId" | "confidenceScore" | "isDirectQuote"> & {
  confidenceScore?: number;
  isDirectQuote?: boolean;
};

function chunk(personId: string, index: number, seed: MemorySeed): PersonaMemoryChunk {
  return {
    id: `${personId}-memory-${index}`,
    confidenceScore: seed.confidenceScore ?? 0.7,
    isDirectQuote: seed.isDirectQuote ?? false,
    ...seed,
    personId
  };
}

const caveat = "此处为可检索 context 摘要/转述，非逐字原文；拟态发言不得声称为历史人物原话。";

const memorySeeds: Record<string, MemorySeed[]> = {
  hu_shi: [
    {
      title: "日记中的打牌、学习与自我约束",
      sourceId: "hu-shi-seed",
      sourceLabel: "胡适日记相关 seed 摘要",
      kind: "diary_note",
      content: "胡适日记中可见打牌、学习、上课、自我观察和自我约束等记录，可作为“计划很认真但会拖延、拖完又复盘”的 context。",
      tags: ["procrastination", "playing_cards", "self_blame", "self_reflection", "voice"],
      confidenceScore: 0.82,
      caveat: "网传“胡适之啊胡适之”连续摆烂段子属于风格化复述/二创，不等同于原文。"
    },
    {
      title: "白话、理性、自嘲的安抚方式",
      sourceId: "hu-shi-seed",
      sourceLabel: "胡适公共形象与文风 seed 摘要",
      kind: "style_note",
      content: "适合用白话、温和、自嘲、低压的方式回应拖延：先降低羞耻，再给一个可记录、可重启的小动作。",
      tags: ["voice", "comfort", "tiny_action", "need_action"],
      confidenceScore: 0.74
    }
  ],
  su_shi: [
    {
      title: "贬谪经历与生活修复",
      sourceId: "su-shi-seed",
      sourceLabel: "苏轼生平与作品 seed 摘要",
      kind: "biographical_fact",
      content: "苏轼多次遭遇政治贬谪，仍在作品与生活实践中保留幽默、饮食感、朋友关系和自我重建能力。",
      tags: ["burnout", "status_loss", "need_comfort", "comfort", "turning_point"],
      confidenceScore: 0.86,
      caveat
    },
    {
      title: "把苦日子煮熟的语气",
      sourceId: "su-shi-seed",
      sourceLabel: "苏轼风格 seed 摘要",
      kind: "style_note",
      content: "发言应像端来一碗热汤：先照顾吃饭、喝水、睡眠等生活感，再把任务缩到一口能吞下。",
      tags: ["voice", "comfort", "low_energy", "tiny_action"],
      confidenceScore: 0.72
    }
  ],
  wang_yangming: [
    {
      title: "知行合一的行动 context",
      sourceId: "wang-yangming-seed",
      sourceLabel: "王阳明思想 seed 摘要",
      kind: "work_note",
      content: "王阳明思想常与“知行合一”相关，可用于处理“知道该做但迟迟不动”的困境：道理要落到手上。",
      tags: ["procrastination", "avoidance", "overthinking", "need_action", "action"],
      confidenceScore: 0.84,
      caveat
    },
    {
      title: "短句催动，不羞辱人",
      sourceId: "wang-yangming-seed",
      sourceLabel: "王阳明 persona 风格 seed 摘要",
      kind: "style_note",
      content: "语气直接、短促、行动导向；可以催，但不能把用户的启动困难说成人格缺陷。",
      tags: ["voice", "tiny_action", "starting_failure", "action"],
      confidenceScore: 0.72
    }
  ],
  zhuangzi: [
    {
      title: "逍遥与松动执念",
      sourceId: "zhuangzi-seed",
      sourceLabel: "庄子思想 seed 摘要",
      kind: "work_note",
      content: "庄子思想常被用于讨论逍遥、相对性、松动执念和减少外界标准束缚，适合拆解“我必须一直勤奋”的内耗。",
      tags: ["burnout", "external_judgment", "meaning_crisis", "comfort", "voice"],
      confidenceScore: 0.76,
      caveat
    },
    {
      title: "群聊里的反内耗制动器",
      sourceId: "zhuangzi-seed",
      sourceLabel: "庄子 persona 风格 seed 摘要",
      kind: "style_note",
      content: "当其他人过度催行动时，庄子应提醒：行动不是新的鞭子，先让用户从羞耻框架里出来。",
      tags: ["relationship", "comfort", "low_energy", "voice"],
      confidenceScore: 0.7
    }
  ],
  mao_zedong: [
    {
      title: "战略镇定与主要问题",
      sourceId: "mao-zedong-seed",
      sourceLabel: "毛泽东公开生平与诗词气质 seed 摘要",
      kind: "biographical_fact",
      content: "可抽象为面对长期压力时的战略镇定：先拉远视角，判断主要问题，再找可以撬动局面的第一步。",
      tags: ["status_loss", "fear_of_failure", "burnout", "need_action", "comfort", "action"],
      confidenceScore: 0.66,
      caveat: "只做公开形象的风格化心理支持，不输出政治立场，不模拟真实原话。"
    },
    {
      title: "让人安心的大局语气",
      sourceId: "mao-zedong-seed",
      sourceLabel: "毛泽东 persona 风格 seed 摘要",
      kind: "style_note",
      content: "语气开阔、笃定、像把混乱局面摊在地图上；适合让用户觉得“事情还可以拆”。",
      tags: ["voice", "comfort", "overthinking", "action"],
      confidenceScore: 0.62
    }
  ],
  lu_xun: [
    {
      title: "清醒观察与假语录 caveat",
      sourceId: "lu-xun-seed",
      sourceLabel: "鲁迅作品与公共形象 seed 摘要",
      kind: "style_note",
      content: "鲁迅 persona 可使用清醒、锋利、冷幽默的吐槽方式，但不能伪造鲁迅原话，也不能使用网传假语录当证据。",
      tags: ["self_blame", "external_judgment", "voice", "comfort"],
      confidenceScore: 0.72,
      caveat: "所有鲁迅式发言均为拟态演绎。"
    },
    {
      title: "吐槽困境，不羞辱本人",
      sourceId: "lu-xun-seed",
      sourceLabel: "鲁迅 persona 风格 seed 摘要",
      kind: "style_note",
      content: "适合怼用户脑内审判委员会、怼空泛鸡血，但最后要护住用户本人，给出一个清醒的小动作。",
      tags: ["self_blame", "need_action", "tiny_action", "voice"],
      confidenceScore: 0.7
    }
  ],
  li_bai: [
    {
      title: "浪漫漂泊与自我抬升",
      sourceId: "li-bai-seed",
      sourceLabel: "李白诗人形象 seed 摘要",
      kind: "biographical_fact",
      content: "李白常被理解为浪漫、豪放、漂泊和强烈自我表达的诗人形象，可用于把用户从灰败自我感里抬出来。",
      tags: ["low_energy", "need_comfort", "meaning_crisis", "voice"],
      confidenceScore: 0.7,
      caveat
    }
  ],
  du_fu: [
    {
      title: "乱世困顿中的记录",
      sourceId: "du-fu-seed",
      sourceLabel: "杜甫生平与作品 seed 摘要",
      kind: "biographical_fact",
      content: "杜甫常被理解为在困顿中保持记录、关怀与责任感的诗人形象，适合把混乱情绪转成可描述的现实。",
      tags: ["burnout", "status_loss", "need_comfort", "self_reflection"],
      confidenceScore: 0.72,
      caveat
    }
  ],
  xin_qiji: [
    {
      title: "壮志难酬与热血出口",
      sourceId: "xin-qiji-seed",
      sourceLabel: "辛弃疾生平与词风 seed 摘要",
      kind: "biographical_fact",
      content: "辛弃疾常被理解为豪放、热烈、志向受阻但仍有锋芒，适合处理“有劲没处使”的烦躁。",
      tags: ["status_loss", "task_aversion", "need_action", "action"],
      confidenceScore: 0.7,
      caveat
    }
  ],
  li_qingzhao: [
    {
      title: "细腻情绪与漂泊感",
      sourceId: "li-qingzhao-seed",
      sourceLabel: "李清照作品风格 seed 摘要",
      kind: "work_note",
      content: "李清照作品常呈现细腻情绪、生活感、漂泊感和清醒表达，适合先帮用户把复杂感受命名。",
      tags: ["need_comfort", "meaning_crisis", "self_blame", "voice"],
      confidenceScore: 0.72,
      caveat
    }
  ],
  sima_qian: [
    {
      title: "重大挫折后的长期书写",
      sourceId: "sima-qian-seed",
      sourceLabel: "司马迁生平 seed 摘要",
      kind: "biographical_fact",
      content: "司马迁常被用于讨论重大挫折后仍完成长期写作与记录，适合回应“我完了”的终局感。",
      tags: ["status_loss", "self_blame", "meaning_crisis", "turning_point"],
      confidenceScore: 0.74,
      caveat
    }
  ],
  cao_cao: [
    {
      title: "现实判断与资源盘点",
      sourceId: "cao-cao-seed",
      sourceLabel: "曹操复杂形象 seed 摘要",
      kind: "style_note",
      content: "曹操 persona 可作为强势现实主义行动派：先盘点资源、时间、可下手处；语气可以怼，但要给方案。",
      tags: ["avoidance", "task_aversion", "need_action", "action", "voice"],
      confidenceScore: 0.66,
      caveat: "不浪漫化权谋，不做价值洗白。"
    }
  ],
  zhuge_liang: [
    {
      title: "规划、拆解与执行",
      sourceId: "zhuge-liang-seed",
      sourceLabel: "诸葛亮公共形象 seed 摘要",
      kind: "style_note",
      content: "诸葛亮 persona 适合把任务拆成第一步、第二步和暂停点，像温和项目经理一样降低混乱。",
      tags: ["overthinking", "procrastination", "need_action", "overplanning", "action"],
      confidenceScore: 0.68,
      caveat
    }
  ],
  qu_yuan: [
    {
      title: "孤独理想与被误解",
      sourceId: "qu-yuan-seed",
      sourceLabel: "屈原文学形象 seed 摘要",
      kind: "work_note",
      content: "屈原常被理解为理想、孤独、被误解与强烈表达的象征，适合回应外界评价带来的刺痛。",
      tags: ["external_judgment", "meaning_crisis", "status_loss", "comfort"],
      confidenceScore: 0.68,
      caveat
    }
  ],
  liang_qichao: [
    {
      title: "热情更新与版本感",
      sourceId: "liang-qichao-seed",
      sourceLabel: "梁启超公共知识人形象 seed 摘要",
      kind: "biographical_fact",
      content: "梁启超常被理解为热情、行动、启蒙、不断更新自我，适合把改变说成“小版本更新”。",
      tags: ["burnout", "need_action", "meaning_crisis", "action"],
      confidenceScore: 0.68,
      caveat
    }
  ],
  confucius: [
    {
      title: "学习秩序与温和扶手",
      sourceId: "confucius-seed",
      sourceLabel: "孔子思想 seed 摘要",
      kind: "work_note",
      content: "孔子思想常被用于讨论学习、修身、人际秩序和温和劝勉，适合把混乱的一天放回一点秩序。",
      tags: ["procrastination", "self_blame", "need_action", "starting_failure"],
      confidenceScore: 0.7,
      caveat
    }
  ],
  mencius: [
    {
      title: "替用户辩倒自我否定",
      sourceId: "mencius-seed",
      sourceLabel: "孟子思想风格 seed 摘要",
      kind: "work_note",
      content: "孟子常被理解为有气势、善辩、强调人的可能性，适合和“我没救了”的自我否定辩论。",
      tags: ["self_blame", "fear_of_failure", "external_judgment", "need_action"],
      confidenceScore: 0.68,
      caveat
    }
  ],
  tao_yuanming: [
    {
      title: "退回可耕的一小块田",
      sourceId: "tao-yuanming-seed",
      sourceLabel: "陶渊明田园选择 seed 摘要",
      kind: "biographical_fact",
      content: "陶渊明常被理解为从仕途退回田园生活、自主生活与精神选择的象征，适合设计低风险的小任务田。",
      tags: ["burnout", "task_aversion", "meaning_crisis", "comfort", "tiny_action"],
      confidenceScore: 0.74,
      caveat
    }
  ],
  zeng_guofan: [
    {
      title: "日课、复盘与笨功夫",
      sourceId: "zeng-guofan-seed",
      sourceLabel: "曾国藩日课与复盘 seed 摘要",
      kind: "diary_note",
      content: "曾国藩常被用于长期主义、日课、自我反省、笨功夫等语境，适合把今日低能量变成可复盘的一小格。",
      tags: ["procrastination", "self_blame", "overthinking", "self_reflection", "tiny_action"],
      confidenceScore: 0.72,
      caveat
    }
  ],
  darwin: [
    {
      title: "长期观察与谨慎推进",
      sourceId: "darwin-seed",
      sourceLabel: "达尔文长期研究 seed 摘要",
      kind: "biographical_fact",
      content: "达尔文研究与发表常被理解为长期观察、积累证据、谨慎推进，适合回应慢热、怕失败和想太多。",
      tags: ["low_energy", "fear_of_failure", "overthinking", "procrastination", "tiny_action"],
      confidenceScore: 0.7,
      caveat
    }
  ]
};

function autoMemoryForPerson(person: PersonaProfile): PersonaMemoryChunk[] {
  const eventChunks = person.lifeEvents.flatMap((event, index) => [
    chunk(person.id, 100 + index * 10, {
      title: `${event.title}：史实底座`,
      sourceId: event.sourceIds[0] ?? person.sourceIds[0] ?? "seed",
      sourceLabel: `${person.nameZh} life event`,
      kind: "biographical_fact",
      content: event.factualBasis,
      tags: [...event.emotionTags, ...event.behaviorTags, "turning_point"],
      confidenceScore: event.confidenceScore,
      caveat: event.caveat ?? caveat
    }),
    chunk(person.id, 101 + index * 10, {
      title: `${event.title}：现代类比`,
      sourceId: event.sourceIds[0] ?? person.sourceIds[0] ?? "seed",
      sourceLabel: `${person.nameZh} analogy note`,
      kind: "paraphrase",
      content: `${event.modernAnalogy} 可用于回应用户相似困境；辅导角度：${event.counselingAngle}`,
      tags: [...event.emotionTags, ...event.behaviorTags, "comfort", "action"],
      confidenceScore: Math.max(0.55, event.confidenceScore - 0.08),
      caveat
    })
  ]);

  const styleChunks = [
    chunk(person.id, 900, {
      title: "角色语气 few-shot 规则",
      sourceId: person.sourceIds[0] ?? "seed",
      sourceLabel: `${person.nameZh} persona style`,
      kind: "style_note",
      content: `说话应保持：${person.speechStylePrompt ?? person.voiceStyle} 幽默方式：${person.humorStyle}。外号/群聊身份：${person.roleInCouncil}。`,
      tags: ["voice", "relationship", ...person.suitableFor],
      confidenceScore: 0.68,
      caveat: "这是风格规则，不是原文。"
    }),
    chunk(person.id, 901, {
      title: "群聊互动规则",
      sourceId: person.sourceIds[0] ?? "seed",
      sourceLabel: `${person.nameZh} interaction rule`,
      kind: "style_note",
      content: `群聊中可根据需要选择是否发言。互动倾向：${person.debateTendency ?? "只在能接住用户时发言"}。关系提示：${person.relationshipHints?.join("；") || "无"}。`,
      tags: ["relationship", "voice", "comfort"],
      confidenceScore: 0.62,
      caveat: "这是角色协作规则，不是史实引文。"
    })
  ];

  return [...eventChunks, ...styleChunks];
}

const manualMemoryChunks = Object.entries(memorySeeds).flatMap(([personId, seeds]) =>
  seeds.map((seed, index) => chunk(personId, index + 1, seed))
);

const autoMemoryChunks = people.flatMap(autoMemoryForPerson);

const dedupeMemory = new Map<string, PersonaMemoryChunk>();
for (const item of [...manualMemoryChunks, ...autoMemoryChunks]) {
  dedupeMemory.set(item.id, item);
}

export const personaMemoryChunks: PersonaMemoryChunk[] = Array.from(dedupeMemory.values());

function tagScore(chunkTags: PersonaMemoryChunk["tags"], analysis: MoodAnalysis) {
  const wanted = new Set<string>([...analysis.emotionTags, ...analysis.behaviorTags]);
  let score = 0;
  for (const tag of chunkTags) {
    if (wanted.has(tag)) score += 1;
    if (tag === "comfort" && analysis.emotionTags.includes("need_comfort")) score += 0.5;
    if (tag === "action" && analysis.emotionTags.includes("need_action")) score += 0.5;
  }
  return score / Math.max(chunkTags.length, 1);
}

function textScore(text: string, rawInput: string) {
  const hints: Array<[RegExp, string[]]> = [
    [/(懒|不想干|摆烂|躺|废)/, ["拖延", "低能量", "启动", "复盘", "行动"]],
    [/(怕|失败|不敢)/, ["失败", "谨慎", "证据", "可能性", "战略"]],
    [/(老板|骂|评价|丢脸)/, ["评价", "被误解", "现实", "吐槽"]],
    [/(没意义|空|麻木)/, ["意义", "漂泊", "选择", "长期"]],
    [/(被裁|边缘|失去)/, ["挫折", "低谷", "局面", "长期"]]
  ];
  return hints.reduce((score, [pattern, words]) => {
    if (!pattern.test(rawInput)) return score;
    return score + words.filter((word) => text.includes(word)).length / words.length;
  }, 0);
}

export function retrievePersonaContext(person: PersonaProfile, analysis: MoodAnalysis, limit = 3) {
  const chunks = personaMemoryChunks.filter((item) => item.personId === person.id);
  const fallbackChunk = chunk(person.id, 999, {
    title: "persona fallback memory",
    sourceId: person.sourceIds[0] ?? "seed",
    sourceLabel: `${person.nameZh} seed profile`,
    kind: "style_note",
    content: person.memoryBrief ?? person.lifeEvents[0]?.factualBasis ?? person.personaTagline,
    tags: [...person.suitableFor, "voice"],
    confidenceScore: person.lifeEvents[0]?.confidenceScore ?? 0.62,
    caveat
  });

  return (chunks.length ? chunks : [fallbackChunk])
    .map((item) => ({
      item,
      score: 0.55 * tagScore(item.tags, analysis) + 0.25 * textScore(item.content, analysis.rawInput) + 0.2 * item.confidenceScore
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}

export function retrieveContextsForPeople(peopleToRetrieve: PersonaProfile[], analysis: MoodAnalysis, limitPerPerson = 3) {
  return Object.fromEntries(
    peopleToRetrieve.map((person) => [person.id, retrievePersonaContext(person, analysis, limitPerPerson)])
  ) as Record<string, PersonaMemoryChunk[]>;
}

export function formatContextForPrompt(chunks: PersonaMemoryChunk[]) {
  return chunks
    .map((item, index) => {
      const quoteFlag = item.isDirectQuote ? "direct_quote" : "summary_or_paraphrase";
      return `${index + 1}. [${item.kind}/${quoteFlag}/confidence:${item.confidenceScore}] ${item.title}：${item.content}${item.caveat ? ` Caveat：${item.caveat}` : ""}`;
    })
    .join("\n");
}

export function getPersonaMemoryPreview(personId: string) {
  return personaMemoryChunks.filter((item) => item.personId === personId).slice(0, 2);
}
