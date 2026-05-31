"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Edit3, Save, Sparkles, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { BiographyEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateZh(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function monthLabel(month: Date) {
  return `${month.getFullYear()}年${month.getMonth() + 1}月`;
}

function daysInMonth(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = new Date(year, monthIndex, 1);
  const total = new Date(year, monthIndex + 1, 0).getDate();
  const blanks = Array.from({ length: first.getDay() }, () => null);
  const days = Array.from({ length: total }, (_, index) => new Date(year, monthIndex, index + 1));
  return [...blanks, ...days];
}

type BiographyBookProps = {
  entries: BiographyEntry[];
  selectedDate: string;
  generating: boolean;
  canGenerate: boolean;
  onSelectDate: (date: string) => void;
  onGenerate: () => void;
  onUpdate: (entryId: string, patch: Pick<BiographyEntry, "title" | "body">) => void;
  onDelete: (entryId: string) => void;
  onClose: () => void;
};

export function BiographyBook({
  entries,
  selectedDate,
  generating,
  canGenerate,
  onSelectDate,
  onGenerate,
  onUpdate,
  onDelete,
  onClose
}: BiographyBookProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => `${a.date}:${a.createdAt}`.localeCompare(`${b.date}:${b.createdAt}`)),
    [entries]
  );
  const entriesByDate = useMemo(() => {
    const map = new Map<string, BiographyEntry[]>();
    for (const entry of sortedEntries) {
      map.set(entry.date, [...(map.get(entry.date) ?? []), entry]);
    }
    return map;
  }, [sortedEntries]);

  const visibleEntries = entriesByDate.get(selectedDate) ?? [];
  const entry = visibleEntries[visibleEntries.length - 1] ?? null;
  const currentIndex = entry ? sortedEntries.findIndex((item) => item.id === entry.id) : -1;
  const hasRecordDates = new Set(entries.map((item) => item.date));

  function movePage(direction: -1 | 1) {
    if (sortedEntries.length === 0) return;
    const nextIndex = currentIndex < 0 ? 0 : Math.min(Math.max(currentIndex + direction, 0), sortedEntries.length - 1);
    onSelectDate(sortedEntries[nextIndex].date);
    setEditing(false);
  }

  function beginEdit(target: BiographyEntry) {
    setDraftTitle(target.title);
    setDraftBody(target.body);
    setEditing(true);
  }

  function saveEdit(target: BiographyEntry) {
    onUpdate(target.id, { title: draftTitle.trim() || target.title, body: draftBody.trim() || target.body });
    setEditing(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_30%_0%,rgba(251,191,36,0.10),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.74))]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200/20 bg-amber-200/12 text-amber-100">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-white">群聊小传</h2>
            <p className="truncate text-sm text-white/54">诸贤据本日聊天记录，作一页可改可删的史书。</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => setCalendarOpen((value) => !value)} title="展开日历">
            <CalendarDays className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} title="回到群聊">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {calendarOpen ? (
        <div className="border-b border-white/10 bg-black/20 px-4 py-3">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center justify-between">
              <Button variant="secondary" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
                上月
              </Button>
              <div className="text-sm font-semibold text-white">{monthLabel(month)}</div>
              <Button variant="secondary" size="sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                下月
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                <div key={day} className="py-1 text-white/42">
                  {day}
                </div>
              ))}
              {daysInMonth(month).map((day, index) => {
                const key = day ? dateKey(day) : `blank-${index}`;
                const hasRecord = day ? hasRecordDates.has(key) : false;
                const active = key === selectedDate;
                return day ? (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSelectDate(key);
                      setCalendarOpen(false);
                      setEditing(false);
                    }}
                    className={cn(
                      "relative rounded-md border px-2 py-2 text-sm transition",
                      active ? "border-amber-200/70 bg-amber-200/18 text-white" : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
                    )}
                  >
                    {day.getDate()}
                    <span className={cn("absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full", hasRecord ? "bg-amber-300" : "bg-white/14")} />
                  </button>
                ) : (
                  <div key={key} />
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-100">{dateZh(selectedDate)}</div>
              <div className="text-xs text-white/44">{visibleEntries.length ? `本日 ${visibleEntries.length} 则小传` : "本日还没有传记记录"}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => movePage(-1)} disabled={currentIndex <= 0}>
                <ChevronLeft className="h-4 w-4" />
                翻前页
              </Button>
              <Button variant="secondary" size="sm" onClick={() => movePage(1)} disabled={currentIndex < 0 || currentIndex >= sortedEntries.length - 1}>
                翻后页
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={onGenerate} disabled={!canGenerate || generating}>
                <Sparkles className={cn("h-4 w-4", generating && "animate-pulse")} />
                {generating ? "修史中" : "为今日成传"}
              </Button>
            </div>
          </div>

          <motion.div
            key={entry?.id ?? selectedDate}
            initial={{ opacity: 0, rotateY: -7, x: 24 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            transition={{ duration: 0.34 }}
            className="relative mx-auto min-h-[620px] max-w-4xl overflow-hidden rounded-lg border border-amber-950/30 bg-[#efe0bd] text-[#2b1d12] shadow-[0_28px_90px_rgba(0,0,0,0.38)]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:radial-gradient(circle_at_20%_18%,rgba(120,70,20,0.18)_0_1px,transparent_1px),linear-gradient(90deg,rgba(93,53,20,0.18),transparent_12%,transparent_88%,rgba(93,53,20,0.16))] [background-size:26px_26px,100%_100%]" />
            <div className="relative grid min-h-[620px] md:grid-cols-[1fr_1.1fr]">
              <aside className="border-b border-amber-950/20 p-6 md:border-b-0 md:border-r">
                <div className="font-serif text-sm tracking-[0.2em] text-[#765328]">俺也一样 · 起居注</div>
                <div className="mt-5 text-3xl font-black text-[#2b1d12]">{dateZh(selectedDate)}</div>
                <div className="mt-3 text-sm leading-7 text-[#5a3a1c]">
                  此页按本日群聊所成。事实是底座，语气为演绎；名人短评皆为拟态，不作原话。
                </div>
                {entry?.illustrationUrl ? (
                  <div className="mt-6 overflow-hidden rounded-lg border border-[#8a5a24]/24 bg-[#fff6db]/48 p-2 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.illustrationUrl} alt="当日小传插图" className="aspect-[4/5] w-full rounded-md object-cover" />
                  </div>
                ) : (
                  <div className="mt-6 flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed border-[#8a5a24]/28 bg-[#fff6db]/34 text-sm text-[#765328]">
                    插图待成
                  </div>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  {entry?.participants.map((person) => (
                    <span key={person.personId} className="rounded-full border border-[#8a5a24]/30 bg-[#f8edcf]/70 px-3 py-1 text-xs text-[#5a3517]">
                      {person.avatarEmoji} {person.nameZh}
                    </span>
                  ))}
                </div>
              </aside>

              <article className="p-6">
                {entry ? (
                  <>
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        {editing ? (
                          <input
                            value={draftTitle}
                            onChange={(event) => setDraftTitle(event.target.value)}
                            className="w-full rounded-md border border-[#8a5a24]/30 bg-[#fff6db] px-3 py-2 text-xl font-black text-[#2b1d12] outline-none"
                          />
                        ) : (
                          <h3 className="text-2xl font-black text-[#2b1d12]">{entry.title}</h3>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge className="border-[#8a5a24]/20 bg-[#f8edcf]/80 text-[#5a3517]">{entry.chroniclerName}</Badge>
                          <Badge className="border-[#8a5a24]/20 bg-[#f8edcf]/80 text-[#5a3517]">{entry.chroniclerStyle}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {editing ? (
                          <Button size="icon" className="bg-[#5a3517] text-[#fff6db] hover:bg-[#6f431e]" onClick={() => saveEdit(entry)} title="保存">
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="icon" className="bg-[#5a3517] text-[#fff6db] hover:bg-[#6f431e]" onClick={() => beginEdit(entry)} title="编辑">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" className="bg-[#8f2f22] text-[#fff6db] hover:bg-[#a33a2a]" onClick={() => onDelete(entry.id)} title="删除">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {editing ? (
                      <Textarea
                        value={draftBody}
                        onChange={(event) => setDraftBody(event.target.value)}
                        className="min-h-[240px] border-[#8a5a24]/30 bg-[#fff6db] text-[#2b1d12] placeholder:text-[#7c5a35]"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-base leading-9 text-[#2b1d12]">{entry.body}</p>
                    )}

                    {entry.comments.length ? (
                      <div className="mt-8 border-t border-[#8a5a24]/20 pt-5">
                        <div className="mb-3 text-sm font-bold text-[#5a3517]">诸贤批注</div>
                        <div className="space-y-3">
                          {entry.comments.map((comment) => (
                            <div key={comment.id} className="rounded-md border border-[#8a5a24]/20 bg-[#fff6db]/54 p-3">
                              <div className="mb-1 text-sm font-bold text-[#4b2b12]">
                                {comment.speakerEmoji} {comment.speakerName} · {comment.role}
                              </div>
                              <div className="text-sm leading-7 text-[#3a2411]">{comment.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 text-xs leading-5 text-[#765328]">{entry.disclaimer}</div>
                  </>
                ) : (
                  <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                    <BookOpen className="h-12 w-12 text-[#765328]" />
                    <h3 className="mt-4 text-2xl font-black text-[#2b1d12]">此日尚无小传</h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[#5a3a1c]">回到群聊说几句，或直接点击“为今日成传”，让史官据当前聊天记录补上一页。</p>
                  </div>
                )}
              </article>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
