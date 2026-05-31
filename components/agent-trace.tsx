"use client";

import { Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { AgentTraceStep } from "@/lib/types";

const defaultSteps: AgentTraceStep[] = [
  { id: "mood", name: "Mood Parser", status: "running", summary: "正在把丧话翻译成情绪向量" },
  { id: "search", name: "Search Agent", status: "pending", summary: "正在翻人类历史摆烂档案馆" },
  { id: "bio", name: "Bio Ingestion", status: "pending", summary: "正在读取人物生平和人生大事" },
  { id: "persona", name: "Personality Analyzer", status: "pending", summary: "正在分析人格、矛盾和可爱程度" },
  { id: "council", name: "Council Composer", status: "pending", summary: "正在组建先贤小队" },
  { id: "dialogue", name: "Dialogue Engine", status: "pending", summary: "正在准备群聊开场" }
];

export function AgentTrace({ steps = defaultSteps, activeIndex = 0 }: { steps?: AgentTraceStep[]; activeIndex?: number }) {
  const visibleSteps = steps.length ? steps : defaultSteps;

  return (
    <div className="mx-auto mt-8 max-w-4xl rounded-lg border border-white/12 bg-black/20 p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Agent 工作流</h2>
          <p className="text-sm text-white/56">只展示结构化 trace，不展示原始推理。</p>
        </div>
        <div className="hidden text-sm text-cyan-100/80 sm:block">正在从人类历史里捞人...</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visibleSteps.map((step, index) => {
          const computedStatus = step.status === "done" ? "done" : index === activeIndex ? "running" : index < activeIndex ? "done" : "pending";
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-md border p-4 transition",
                computedStatus === "done" && "border-emerald-300/20 bg-emerald-300/8",
                computedStatus === "running" && "border-cyan-300/30 bg-cyan-300/10 shadow-glow",
                computedStatus === "pending" && "border-white/10 bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    computedStatus === "done" && "bg-emerald-300 text-slate-950",
                    computedStatus === "running" && "bg-cyan-300 text-slate-950",
                    computedStatus === "pending" && "bg-white/10 text-white/44"
                  )}
                >
                  {computedStatus === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-semibold text-white">{step.name}</div>
                  <div className="text-xs leading-5 text-white/58">{step.summary}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
