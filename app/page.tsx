"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, MessageSquarePlus, Mic, MicOff, PanelLeft, Send, Sparkles } from "lucide-react";
import { AnimatedBackground } from "@/components/animated-background";
import { BiographyBook } from "@/components/biography-book";
import { SafetyBanner } from "@/components/safety-banner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { ActionPlan, BiographyEntry, CandidateMatch, DialogueMessage, MoodAnalysis, PersonaProfile, SourceItem } from "@/lib/types";
import { cn, percent } from "@/lib/utils";
import { getPersonById } from "@/lib/seed-people";

type AnalyzeResult = {
  ok: true;
  safety?: boolean;
  analysis: MoodAnalysis;
  candidates?: CandidateMatch[];
  sources?: SourceItem[];
  message?: string;
};

type DialogueResult = {
  ok: true;
  messages: DialogueMessage[];
  actionPlan?: ActionPlan;
  disclaimer: string;
};

type BiographyResult = {
  ok: true;
  entry: BiographyEntry;
};

type ChatSession = {
  id: string;
  title: string;
  messages: DialogueMessage[];
  selectedIds: string[];
  selectedNames: string[];
  analysis: MoodAnalysis | null;
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const starter = "我好懒真的不想干了";

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function userMessage(content: string): DialogueMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    speakerId: "user",
    speakerName: "你",
    speakerEmoji: "🫠",
    role: "群聊发起人",
    content,
    type: "user"
  };
}

function systemMessage(content: string, emoji = "🔔"): DialogueMessage {
  return {
    id: `system-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    speakerId: "system",
    speakerName: "群聊系统",
    speakerEmoji: emoji,
    role: "群聊提醒",
    content,
    type: "system",
    layer: "dramatization"
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function HomePage() {
  const [input, setInput] = useState(starter);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [groupActive, setGroupActive] = useState(false);
  const [biographyOpen, setBiographyOpen] = useState(false);
  const [biographyGenerating, setBiographyGenerating] = useState(false);
  const [biographyDate, setBiographyDate] = useState(() => localDateKey());
  const [biographyEntries, setBiographyEntries] = useState<BiographyEntry[]>([]);
  const [typingPersona, setTypingPersona] = useState<{ id: string; name: string; emoji: string; role: string } | null>(null);
  const [pattingId, setPattingId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [safetyMessage, setSafetyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(() => `chat-${Date.now()}`);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const autoBiographyKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("anye-biography-entries");
      if (raw) setBiographyEntries(JSON.parse(raw) as BiographyEntry[]);
    } catch {
      setBiographyEntries([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("anye-biography-entries", JSON.stringify(biographyEntries.slice(-80)));
    } catch {
      // localStorage can be unavailable in private browsing; the in-memory state still works for the session.
    }
  }, [biographyEntries]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, candidates, analyzing, chatting]);

  useEffect(() => {
    if (messages.length === 0) return;
    const firstUser = messages.find((message) => message.type === "user")?.content ?? "新的群聊";
    const session: ChatSession = {
      id: sessionId,
      title: firstUser.slice(0, 18),
      messages,
      selectedIds,
      selectedNames,
      analysis
    };
    setHistory((prev) => [session, ...prev.filter((item) => item.id !== sessionId)].slice(0, 12));
  }, [analysis, messages, selectedIds, selectedNames, sessionId]);

  function resetChat() {
    setSessionId(`chat-${Date.now()}`);
    setInput(starter);
    setMessages([]);
    setCandidates([]);
    setSelectedIds([]);
    setSelectedNames([]);
    setAnalysis(null);
    setSafetyMessage(null);
    setError(null);
    setGroupActive(false);
    setBiographyOpen(false);
    setBiographyDate(localDateKey());
  }

  function loadSession(session: ChatSession) {
    setSessionId(session.id);
    setMessages(session.messages);
    setSelectedIds(session.selectedIds);
    setSelectedNames(session.selectedNames);
    setAnalysis(session.analysis);
    setCandidates([]);
    setSafetyMessage(null);
    setError(null);
    setGroupActive(session.selectedIds.length > 0);
    setBiographyDate(localDateKey());
  }

  async function analyzeFirstMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || analyzing) return;

    setError(null);
    setSafetyMessage(null);
    setCandidates([]);
    setSelectedIds([]);
    setSelectedNames([]);
    setGroupActive(false);
    setMessages([userMessage(trimmed)]);
    setInput("");
    setAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed })
      });
      const data = (await response.json()) as AnalyzeResult | { ok: false; error?: string };
      if (!response.ok || !data.ok) throw new Error("analyze failed");

      if (data.safety) {
        setSafetyMessage(data.message ?? "我听见你现在可能很难受。");
        setAnalysis(data.analysis);
        return;
      }

      const incoming = data.candidates ?? [];
      setAnalysis(data.analysis);
      setCandidates(incoming.slice(0, 8));
      setMessages((prev) => [
        ...prev,
        systemMessage(`找到了 ${incoming.length} 位可能会说“俺也一样”的历史人物。点卡片拉人进群，选好后点“完成”。`, "🫱")
      ]);
    } catch {
      setError("分析接口刚才没接住。你可以再发一次；本地 fallback 不会让页面白屏。");
    } finally {
      setAnalyzing(false);
    }
  }

  function togglePerson(candidate: CandidateMatch) {
    const person = candidate.person;
    const selected = selectedIds.includes(person.id);
    setSelectedIds((ids) => (selected ? ids.filter((id) => id !== person.id) : [...ids, person.id]));
    setSelectedNames((names) => (selected ? names.filter((name) => name !== person.nameZh) : [...names, person.nameZh]));
    setMessages((prev) => [
      ...prev,
      systemMessage(selected ? `${person.avatarEmoji} ${person.nameZh}（${person.roleInCouncil}）退出了群聊。` : `${person.avatarEmoji} ${person.nameZh}（${person.roleInCouncil}）已加入群聊。`, selected ? "👋" : "🔔")
    ]);
  }

  function extractPersonaReplies(data: DialogueResult) {
    return data.messages.filter((message) => message.type === "persona");
  }

  async function appendPersonaRepliesSequential(replies: DialogueMessage[]) {
    for (const reply of replies) {
      setTypingPersona({ id: reply.speakerId, name: reply.speakerName, emoji: reply.speakerEmoji, role: reply.role });
      await sleep(650 + Math.min(reply.content.length * 12, 1100));
      setTypingPersona(null);
      setMessages((prev) => [...prev, reply]);
      if (reply.content.includes("拍了拍你")) {
        setPattingId("user");
        window.setTimeout(() => setPattingId(null), 620);
      }
      await sleep(180);
    }
  }

  async function completeSelection() {
    if (selectedIds.length === 0 || chatting) return;
    const originalInput = messages.find((message) => message.type === "user")?.content ?? input;
    setCandidates([]);
    setGroupActive(true);
    setChatting(true);
    setError(null);
    setMessages((prev) => prev.filter((message) => !message.content.startsWith("找到了")));

    try {
      const response = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: originalInput,
          mode: "group_chat",
          personIds: selectedIds,
          history: messages.slice(-12)
        })
      });
      const data = (await response.json()) as DialogueResult | { ok: false; error?: string };
      if (!response.ok || !data.ok) throw new Error("dialogue failed");
      await appendPersonaRepliesSequential(extractPersonaReplies(data));
    } catch {
      setError("群聊生成失败。人物已经在群里了，你可以继续发一句，他们会接。");
    } finally {
      setChatting(false);
    }
  }

  async function continueGroupChat(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chatting) return;
    setInput("");
    setError(null);
    const nextUserMessage = userMessage(trimmed);
    setMessages((prev) => [...prev, nextUserMessage]);
    setChatting(true);

    try {
      const response = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: trimmed,
          mode: "group_chat",
          personIds: selectedIds,
          history: [...messages, nextUserMessage].slice(-16)
        })
      });
      const data = (await response.json()) as DialogueResult | { ok: false; error?: string };
      if (!response.ok || !data.ok) throw new Error("dialogue failed");
      await appendPersonaRepliesSequential(extractPersonaReplies(data));
    } catch {
      setError("这轮群聊没生成出来。你可以换个说法再发。");
    } finally {
      setChatting(false);
    }
  }

  function sendCurrentInput() {
    if (groupActive) {
      void continueGroupChat(input);
    } else {
      void analyzeFirstMessage(input);
    }
  }

  function patPerson(personId: string) {
    const person = getPersonById(personId);
    if (!person) return;
    const patReplies: Record<string, string> = {
      hu_shi: "你拍了拍胡适，胡适的牌桌轻轻晃了一下。",
      su_shi: "你拍了拍苏轼，锅盖很配合地响了一声。",
      wang_yangming: "你拍了拍王阳明，王阳明看起来准备让你立刻行动。",
      zhuangzi: "你拍了拍庄子，庄子说也许是蝴蝶拍了他。"
    };
    const patMessage: DialogueMessage = {
      ...systemMessage(patReplies[person.id] ?? `你拍了拍${person.nameZh}。`, "👏"),
      id: `pat-${Date.now()}`,
      speakerId: "system",
      speakerName: "群聊系统",
      speakerEmoji: "👏",
      role: "拍一拍",
      effect: "pat",
      targetSpeakerId: person.id,
      targetSpeakerName: person.nameZh
    };
    setMessages((prev) => [...prev, patMessage]);
    setPattingId(person.id);
    window.setTimeout(() => setPattingId(null), 620);
  }

  function startVoiceInput() {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setError("当前浏览器不支持语音输入，可以先用文本输入。");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError("语音输入没有成功，可以再试一次或改用文本。");
    };
    setListening(true);
    recognition.start();
  }

  function scrollCards(direction: "left" | "right") {
    cardsRef.current?.scrollBy({ left: direction === "left" ? -280 : 280, behavior: "smooth" });
  }

  async function generateBiography() {
    if (messages.length === 0 || biographyGenerating) return;
    setBiographyGenerating(true);
    setError(null);
    const personaIds = selectedIds.length
      ? selectedIds
      : Array.from(new Set(messages.filter((message) => message.type === "persona").map((message) => message.speakerId)));

    try {
      const response = await fetch("/api/biography", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          date: biographyDate,
          personIds: personaIds,
          messages: messages.slice(-32)
        })
      });
      const data = (await response.json()) as BiographyResult | { ok: false; error?: string };
      if (!response.ok || !data.ok) throw new Error("biography failed");
      setBiographyEntries((prev) => [...prev, data.entry]);
      setBiographyDate(data.entry.date);
    } catch {
      setError("小传这次没写成。可以稍后再点书页里的“为今日成传”。");
    } finally {
      setBiographyGenerating(false);
    }
  }

  function updateBiography(entryId: string, patch: Pick<BiographyEntry, "title" | "body">) {
    setBiographyEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              ...patch,
              updatedAt: new Date().toISOString()
            }
          : entry
      )
    );
  }

  function deleteBiography(entryId: string) {
    setBiographyEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }

  const currentBiographyEntries = biographyEntries.filter((entry) => entry.sessionId === sessionId);

  useEffect(() => {
    if (!biographyOpen || biographyGenerating) return;
    const canGenerate = messages.some((message) => message.type === "user" || message.type === "persona");
    if (!canGenerate) return;
    const key = `${sessionId}:${biographyDate}`;
    const hasEntry = biographyEntries.some((entry) => entry.sessionId === sessionId && entry.date === biographyDate);
    if (hasEntry || autoBiographyKeys.current.has(key)) return;
    autoBiographyKeys.current.add(key);
    void generateBiography();
    // generateBiography intentionally reads the latest chat state when the book is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biographyDate, biographyEntries, biographyGenerating, biographyOpen, messages, sessionId]);

  const selectedPeople = selectedIds.map(getPersonById).filter((person): person is PersonaProfile => Boolean(person));
  const mentionMatch = input.match(/@([\u4e00-\u9fa5A-Za-z_]*)$/);
  const mentionOptions = mentionMatch
    ? selectedPeople.filter((person) => person.nameZh.includes(mentionMatch[1]) || person.id.includes(mentionMatch[1])).slice(0, 6)
    : [];

  function insertMention(name: string) {
    setInput((value) => value.replace(/@[\u4e00-\u9fa5A-Za-z_]*$/, `@${name} `));
  }

  return (
    <main className="flex h-screen overflow-hidden px-3 py-4 sm:px-6">
      <AnimatedBackground />
      <div className="mx-auto flex h-full w-full max-w-7xl overflow-hidden rounded-lg border border-white/12 bg-slate-950/72 shadow-glow backdrop-blur-xl">
        <aside className={cn("h-full w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-black/22 p-3 sm:w-72", !sidebarOpen && "hidden")}>
          <Button variant="secondary" className="w-full justify-start" onClick={resetChat}>
            <MessageSquarePlus className="h-4 w-4" />
            新开一个群聊
          </Button>
          <div className="mt-5 px-2 text-xs font-semibold text-white/42">历史群聊</div>
          <div className="mt-2 space-y-1">
            {history.length === 0 ? (
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-white/44">还没有历史群聊。</div>
            ) : null}
            {history.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => loadSession(session)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm leading-5 text-white/70 transition hover:bg-white/10",
                  session.id === sessionId && "bg-white/10 text-white"
                )}
              >
                <div className="truncate">{session.title}</div>
                <div className="truncate text-xs text-white/38">{session.selectedNames.length ? session.selectedNames.join("、") : "未建群"}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.05] px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((value) => !value)}>
                <PanelLeft className="h-4 w-4" />
              </Button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300 text-xl text-slate-950">🫱</div>
              <div>
                <h1 className="text-2xl font-black text-white">俺也一样</h1>
                <p className="text-sm text-white/58">说出烦恼，点卡拉人，像群聊一样继续聊。</p>
              </div>
            </div>
            <Button
              variant={biographyOpen ? "default" : "secondary"}
              size="icon"
              onClick={() => setBiographyOpen((value) => !value)}
              title={biographyOpen ? "回到群聊" : "打开传记"}
              aria-label={biographyOpen ? "回到群聊" : "打开传记"}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </header>

          {biographyOpen ? (
            <BiographyBook
              entries={currentBiographyEntries}
              selectedDate={biographyDate}
              generating={biographyGenerating}
              canGenerate={messages.some((message) => message.type === "user" || message.type === "persona")}
              onSelectDate={setBiographyDate}
              onGenerate={generateBiography}
              onUpdate={updateBiography}
              onDelete={deleteBiography}
              onClose={() => setBiographyOpen(false)}
            />
          ) : (
            <>
          {candidates.length > 0 ? (
            <section className="border-b border-white/10 bg-black/18 px-4 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">点卡片拉人进群</div>
                  <div className="text-xs text-white/44">选好后点完成，卡片会收起，群聊开始。</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="icon" onClick={() => scrollCards("left")} aria-label="向左滑动卡片">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={() => scrollCards("right")} aria-label="向右滑动卡片">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div
                ref={cardsRef}
                className="flex max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:thin]"
              >
                {candidates.map((candidate) => {
                  const person = candidate.person;
                  const selected = selectedIds.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => togglePerson(candidate)}
                      className={cn(
                        "w-[238px] shrink-0 snap-start rounded-lg border p-3 text-left transition hover:-translate-y-0.5",
                        selected ? "border-amber-200/70 bg-amber-200/18" : "border-white/10 bg-white/[0.05] hover:bg-white/[0.08]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-2xl">{person.avatarEmoji}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{person.nameZh}</span>
                            <span className="text-xs text-cyan-100">{percent(candidate.score)}</span>
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-amber-100/80">{person.roleInCouncil}</div>
                        </div>
                      </div>
                      <div className="mt-2 line-clamp-2 text-xs leading-5 text-white/72">{person.personaTagline}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="text-xs text-white/42">{selectedNames.length ? `已选择：${selectedNames.join("、")}` : "至少选择一位再完成。"}</div>
                <Button onClick={completeSelection} disabled={selectedIds.length === 0 || chatting}>
                  {chatting ? "生成中" : `完成${selectedIds.length ? `（${selectedIds.length}）` : ""}`}
                </Button>
              </div>
            </section>
          ) : null}

          <ScrollArea className="min-h-0 flex-1 px-4 py-5">
            <div className="mx-auto max-w-4xl space-y-4">
              {messages.length === 0 ? (
                <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-20 text-center">
                  <div className="text-5xl">🫱</div>
                  <h2 className="mt-5 text-3xl font-black text-white">最近有什么想法或烦恼？</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/58">
                    像和 GPT 聊天一样输入。系统会在后台检索历史人物的生平、作品、日记书信线索，然后弹出可加入群聊的名人卡片。
                  </p>
                </div>
              ) : null}

              {messages.map((message) => {
                const isUser = message.type === "user";
                const isSystem = message.type === "system";
                return (
                  <div key={message.id} className={cn("flex gap-3", isUser && "justify-end")}>
                    {!isUser ? (
                      <button
                        type="button"
                        onClick={() => message.type === "persona" && patPerson(message.speakerId)}
                        title={message.type === "persona" ? `拍一拍${message.speakerName}` : undefined}
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-xl transition hover:bg-white/16",
                          message.type !== "persona" && "cursor-default hover:bg-white/10",
                          pattingId === message.speakerId && "animate-[pat-shake_0.42s_ease-in-out_2]"
                        )}
                      >
                        {message.speakerEmoji}
                      </button>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[86%] rounded-lg px-4 py-3 sm:max-w-[72%]",
                        isUser && "bg-white text-slate-950 shadow-sm",
                        isSystem && "border border-cyan-200/14 bg-cyan-200/10 text-cyan-50",
                        !isUser && !isSystem && "border border-white/10 bg-white/[0.07] text-white/86"
                      )}
                    >
                      <div className={cn("mb-1 text-xs font-semibold", isUser ? "text-slate-600" : "text-white/52")}>
                        {message.speakerName} · {message.role}
                      </div>
                      <div className={cn("text-sm leading-7", isUser && "text-slate-950")}>{message.content}</div>
                    </div>
                    {isUser ? (
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-amber-300 text-xl text-slate-950",
                          pattingId === "user" && "animate-[pat-shake_0.42s_ease-in-out_2]"
                        )}
                      >
                        {message.speakerEmoji}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {typingPersona ? (
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-xl">
                    {typingPersona.emoji}
                  </div>
                  <div className="rounded-lg rounded-tl-sm border border-white/10 bg-white/[0.07] px-4 py-3 text-white/72">
                    <div className="mb-1 text-xs font-semibold text-white/52">{typingPersona.name} 输入中...</div>
                    <div className="flex gap-1 py-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/52 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/52 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/52" />
                    </div>
                  </div>
                </div>
              ) : null}

              {safetyMessage ? <SafetyBanner message={safetyMessage} /> : null}
              {error ? <div className="rounded-md border border-rose-200/20 bg-rose-300/10 p-3 text-sm text-rose-50">{error}</div> : null}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <footer className="shrink-0 border-t border-white/10 bg-slate-950/88 p-3">
            {groupActive && selectedNames.length > 0 ? (
              <div className="mx-auto mb-2 flex max-w-4xl flex-wrap gap-2">
                {selectedNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setInput((value) => `${value}${value && !value.endsWith(" ") ? " " : ""}@${name} `)}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/72 transition hover:bg-white/12"
                  >
                    @{name}
                  </button>
                ))}
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/38">点击名人头像可拍一拍</span>
              </div>
            ) : null}
            <div className="relative mx-auto flex max-w-4xl items-end gap-2">
              {mentionOptions.length > 0 ? (
                <div className="absolute bottom-[calc(100%+0.5rem)] left-12 z-20 w-56 overflow-hidden rounded-lg border border-white/12 bg-slate-950/96 p-1 shadow-glow backdrop-blur">
                  {mentionOptions.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => insertMention(person.nameZh)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-white/82 transition hover:bg-white/10"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-base">{person.avatarEmoji}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{person.nameZh}</span>
                        <span className="block truncate text-xs text-white/42">{person.roleInCouncil}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <Button variant="secondary" size="icon" onClick={startVoiceInput} disabled={listening} title="语音输入">
                {listening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={groupActive ? "继续在群里说点什么..." : "输入你最近的想法/烦恼..."}
                className="min-h-[54px] flex-1 bg-white text-slate-950 placeholder:text-slate-400"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendCurrentInput();
                  }
                }}
              />
              <Button size="icon" onClick={sendCurrentInput} disabled={analyzing || chatting || input.trim().length === 0} title="发送">
                {analyzing || chatting ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mx-auto mt-2 max-w-4xl text-xs leading-5 text-white/42">
              角色发言均为拟态演绎，不代表历史人物真实言论。
              {selectedNames.length > 0 ? ` 群成员：${selectedNames.join("、")}` : ""}
            </div>
          </footer>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
