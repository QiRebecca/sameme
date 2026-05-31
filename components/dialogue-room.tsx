"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DialogueMessage } from "@/lib/types";

const members = [
  ["🃏", "胡适", "自责型摸鱼代表"],
  ["🍜", "苏轼", "低谷生活修复师"],
  ["⚔️", "王阳明", "行动启动器"],
  ["🦋", "庄子", "反内耗观察员"]
];

export function DialogueRoom({ messages, title = "不想干活也不是世界末日群" }: { messages: DialogueMessage[]; title?: string }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-white/56">以下为拟态演绎 / dramatization，不代表历史人物真实言论。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map(([emoji, name, role]) => (
            <Badge key={name} className="bg-white/[0.06]">
              {emoji} {name}：{role}
            </Badge>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/62">
          角色演绎，不代表历史人物原话。
        </div>
        <ScrollArea className="max-h-[620px] p-4">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isUser = message.type === "user";
              const isHost = message.type === "host";
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[92%] gap-3 sm:max-w-[78%] ${isUser ? "flex-row-reverse" : ""}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/10 text-xl">
                      {message.speakerEmoji}
                    </div>
                    <div
                      className={
                        isUser
                          ? "rounded-lg rounded-tr-sm bg-amber-300 px-4 py-3 text-slate-950"
                          : isHost
                            ? "rounded-lg border border-cyan-200/16 bg-cyan-200/10 px-4 py-3 text-cyan-50"
                            : "rounded-lg rounded-tl-sm border border-white/10 bg-white/[0.07] px-4 py-3 text-white/82"
                      }
                    >
                      <div className={`mb-1 text-xs font-semibold ${isUser ? "text-slate-700" : "text-white/52"}`}>
                        {message.speakerName} · {message.role}
                      </div>
                      <div className="text-sm leading-7">{message.content}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>
    </section>
  );
}
