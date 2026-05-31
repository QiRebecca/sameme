"use client";

import { MessageCircle, Plus, TimerReset } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { percent } from "@/lib/utils";
import type { CandidateMatch, DialogueMode } from "@/lib/types";

export function CandidateCard({
  candidate,
  index,
  onMode
}: {
  candidate: CandidateMatch;
  index: number;
  onMode: (mode: DialogueMode, personIds: string[]) => void;
}) {
  const { person, matchedEvent } = candidate;

  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Card className="group relative h-full overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-amber-200/28">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent opacity-70" />
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/12 bg-white/10 text-3xl">
                {person.avatarEmoji}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{person.nameZh}</h3>
                  <Badge>{person.era}</Badge>
                </div>
                <p className="mt-1 text-sm text-amber-100/80">{person.roleInCouncil}</p>
              </div>
            </div>
            <Badge className="border-cyan-200/18 bg-cyan-200/10 text-cyan-50">相似 {percent(candidate.score)}</Badge>
          </div>
          <p className="mt-4 text-sm font-medium leading-6 text-white/76">{person.personaTagline}</p>
          <p className="text-xs leading-5 text-white/50">适合你如果：{candidate.whyMatched}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            tabs={[
              {
                value: "fact",
                label: "史实",
                content: (
                  <div className="space-y-2">
                    <p>{matchedEvent.factualBasis}</p>
                    {matchedEvent.caveat ? <p className="rounded-md border border-amber-200/16 bg-amber-200/10 p-2 text-amber-50">{matchedEvent.caveat}</p> : null}
                  </div>
                )
              },
              { value: "analogy", label: "类比", content: <p>{matchedEvent.modernAnalogy}</p> },
              { value: "drama", label: "演绎", content: <p>角色演绎，不代表历史人物原话。<br />“{candidate.openingLine}”</p> }
            ]}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/52">
            <Badge className="bg-white/[0.06]">证据置信 {percent(matchedEvent.confidenceScore)}</Badge>
            <Badge className="bg-white/[0.06]">角色演绎</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="secondary" size="sm" onClick={() => onMode("one_on_one", [person.id])}>
              <MessageCircle className="h-3.5 w-3.5" />
              和 TA 1v1
            </Button>
            <Button variant="outline" size="sm" onClick={() => onMode("group_chat", ["hu_shi", "su_shi", "wang_yangming", "zhuangzi"])}>
              <Plus className="h-3.5 w-3.5" />
              加入群聊
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onMode("tiny_action", [person.id])}>
              <TimerReset className="h-3.5 w-3.5" />
              小行动
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
