"use client";

import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SourceItem } from "@/lib/types";

export function SourceDrawer({ sources }: { sources: SourceItem[] }) {
  const [open, setOpen] = useState(false);
  const hasWiki = sources.some((source) => source.sourceType === "wikipedia");

  return (
    <section className="mt-6">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        <BookOpen className="h-4 w-4" />
        资料边界
        <Badge className="ml-1">{hasWiki ? "联网补充成功" : "使用本地人物库"}</Badge>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </Button>
      {open ? (
        <Card className="mt-3 p-4">
          <p className="mb-3 text-sm leading-6 text-white/66">
            以下为 seed data 与可选 Wikipedia 摘要，demo 中的对话均为拟态演绎，不代表历史人物真实言论。
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {sources.map((source) => (
              <div key={source.id} className="rounded-md border border-white/10 bg-black/18 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-white">{source.title}</div>
                  <Badge>{source.sourceType}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">{source.note}</p>
                {source.url ? (
                  <a className="mt-2 inline-block text-xs text-cyan-100 hover:underline" href={source.url} target="_blank" rel="noreferrer">
                    查看来源
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
