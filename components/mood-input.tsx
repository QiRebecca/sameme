"use client";

import { Send, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const chips = [
  "我好懒真的不想干了",
  "我废了，今天完全不想动",
  "我想创业但怕失败",
  "我被老板骂到怀疑人生",
  "我感觉人生好没意义"
];

export function MoodInput({
  value,
  onChange,
  onSubmit,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-lg border border-white/12 bg-slate-950/72 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <Badge className="bg-white/[0.06] text-white/64">SageMatch 输入窗口</Badge>
      </div>
      <div className="px-4 pt-4">
        <div className="mb-2 text-sm font-medium text-white/78">把真实情绪丢进来</div>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="比如：我好懒真的不想干了"
        disabled={disabled}
        className="mx-4 w-[calc(100%-2rem)] border-white/10 bg-black/30"
      />
      <div className="mt-3 flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChange(chip)}
              disabled={disabled}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-white/68 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
        <Button onClick={onSubmit} disabled={disabled || value.trim().length === 0} size="lg" className="shrink-0">
          {disabled ? <WandSparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
          召唤先贤
        </Button>
      </div>
    </div>
  );
}
