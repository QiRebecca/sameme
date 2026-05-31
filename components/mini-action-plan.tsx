"use client";

import { CheckCircle2, PartyPopper } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ActionPlan } from "@/lib/types";

export function MiniActionPlan({ plan }: { plan: ActionPlan }) {
  const [done, setDone] = useState(false);

  return (
    <section className="mt-8">
      <Card className="overflow-hidden border-amber-200/18">
        <div className="bg-gradient-to-r from-amber-200/16 via-cyan-200/10 to-fuchsia-200/12 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{plan.title}</h2>
              <p className="mt-1 text-sm text-white/62">预计 {plan.durationMinutes} 分钟，小到离谱，但能启动。</p>
            </div>
            <Button onClick={() => setDone(true)} size="lg">
              <CheckCircle2 className="h-4 w-4" />
              我动了
            </Button>
          </div>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 lg:grid-cols-3">
          {plan.steps.map((step, index) => (
            <div key={step} className="rounded-md border border-white/10 bg-black/18 p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-white/78">{step}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-5 text-sm leading-7 text-white/70">{plan.completionText}</div>
        {done ? (
          <div className="border-t border-emerald-200/20 bg-emerald-300/10 p-5 text-emerald-50">
            <div className="flex items-start gap-3">
              <PartyPopper className="mt-0.5 h-5 w-5" />
              <p className="font-semibold">
                恭喜，你已经从“完全不动的人类”升级为“动了一点点的人类”。这非常不容易。
              </p>
            </div>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
