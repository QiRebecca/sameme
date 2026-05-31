export type EmotionTag =
  | "low_energy"
  | "procrastination"
  | "self_blame"
  | "avoidance"
  | "burnout"
  | "task_aversion"
  | "meaning_crisis"
  | "fear_of_failure"
  | "external_judgment"
  | "status_loss"
  | "overthinking"
  | "need_comfort"
  | "need_action";

export type BehaviorTag =
  | "doomscrolling"
  | "playing_cards"
  | "lying_flat"
  | "starting_failure"
  | "overplanning"
  | "retreat"
  | "tiny_action"
  | "self_reflection";

export type SourceItem = {
  id: string;
  title: string;
  url?: string;
  sourceType: "seed" | "wikipedia" | "wikidata" | "article" | "diary" | "book" | "mock";
  note: string;
};

export type PersonaMemoryChunk = {
  id: string;
  personId: string;
  title: string;
  sourceId: string;
  sourceLabel: string;
  kind: "biographical_fact" | "diary_note" | "work_note" | "verified_quote" | "paraphrase" | "style_note";
  content: string;
  tags: Array<EmotionTag | BehaviorTag | "voice" | "relationship" | "turning_point" | "comfort" | "action">;
  confidenceScore: number;
  isDirectQuote: boolean;
  caveat?: string;
};

export type LifeEventCard = {
  id: string;
  personId: string;
  title: string;
  period?: string;
  factualBasis: string;
  caveat?: string;
  modernAnalogy: string;
  emotionTags: EmotionTag[];
  behaviorTags: BehaviorTag[];
  counselingAngle: string;
  confidenceScore: number;
  sourceIds: string[];
};

export type PersonaProfile = {
  id: string;
  nameZh: string;
  nameEn: string;
  era: string;
  identity: string[];
  avatarEmoji: string;
  avatarImage?: string;
  stickerImage?: string;
  roleInCouncil: string;
  personaTagline: string;
  voiceStyle: string;
  humorStyle: string;
  memoryBrief?: string;
  personality?: string[];
  speechStylePrompt?: string;
  debateTendency?: string;
  relationshipHints?: string[];
  suitableFor: EmotionTag[];
  avoidClaims: string[];
  sourceIds: string[];
  lifeEvents: LifeEventCard[];
  personaFunScore: number;
};

export type MoodAnalysis = {
  rawInput: string;
  riskLevel: "low" | "medium" | "high";
  detectedMode: string;
  emotionTags: EmotionTag[];
  behaviorTags: BehaviorTag[];
  toneNeeded: string[];
  userNeed: string;
  summaryForUser: string;
};

export type CandidateMatch = {
  person: PersonaProfile;
  matchedEvent: LifeEventCard;
  score: number;
  scoreBreakdown: {
    emotionSimilarity: number;
    behaviorSimilarity: number;
    evidenceQuality: number;
    personaFunScore: number;
    diversityScore: number;
  };
  whyMatched: string;
  openingLine: string;
};

export type AgentTraceStep = {
  id: string;
  name: string;
  status: "pending" | "running" | "done" | "error";
  summary: string;
};

export type DialogueMessage = {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerEmoji: string;
  role: string;
  content: string;
  type: "user" | "persona" | "host" | "system";
  layer?: "fact" | "analogy" | "dramatization";
  effect?: "pat";
  targetSpeakerId?: string;
  targetSpeakerName?: string;
};

export type ActionPlan = {
  title: string;
  durationMinutes: number;
  steps: string[];
  completionText: string;
};

export type DialogueMode = "one_on_one" | "group_chat" | "tiny_action";

export type BiographyComment = {
  id: string;
  personId: string;
  speakerName: string;
  speakerEmoji: string;
  role: string;
  content: string;
  layer: "dramatization";
};

export type BiographyEntry = {
  id: string;
  sessionId: string;
  date: string;
  title: string;
  chroniclerName: string;
  chroniclerStyle: string;
  body: string;
  illustrationUrl?: string;
  illustrationPrompt?: string;
  participants: Array<{
    personId: string;
    nameZh: string;
    avatarEmoji: string;
    role: string;
  }>;
  comments: BiographyComment[];
  createdAt: string;
  updatedAt: string;
  disclaimer: string;
};
