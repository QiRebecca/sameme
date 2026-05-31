"use client";

import { MessagesSquare, UserRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DialogueMode } from "@/lib/types";

const modes = [
  {
    mode: "one_on_one" as const,
    title: "1v1 模式",
    desc: "选一位先贤陪你聊五分钟",
    icon: UserRound
  },
  {
    mode: "group_chat" as const,
    title: "群聊模式",
    desc: "让胡适、苏轼、王阳明、庄子围观你的摆烂现场",
    icon: MessagesSquare
  },
  {
    mode: "tiny_action" as const,
    title: "5 分钟开场",
    desc: "别聊太多，直接给我一个小到离谱的任务",
    icon: Zap
  }
];

export function ModeSelector({ onMode }: { onMode: (mode: DialogueMode) => void }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">选择召唤方式</h2>
          <p className="mt-1 text-sm text-white/56">演绎不代表历史人物真实言论。</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {modes.map((item) => (
          <Card key={item.mode} className="p-4 transition hover:-translate-y-1 hover:border-cyan-200/24">
            <item.icon className="h-6 w-6 text-cyan-100" />
            <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
            <p className="mt-1 min-h-[44px] text-sm leading-6 text-white/60">{item.desc}</p>
            <Button className="mt-4 w-full" variant={item.mode === "group_chat" ? "default" : "secondary"} onClick={() => onMode(item.mode)}>
              开始
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
