"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-5xl pt-10 text-center sm:pt-16"
    >
      <Badge className="mb-5 border-amber-200/20 bg-amber-200/10 text-amber-100">
        <Sparkles className="h-3.5 w-3.5" />
        Historical emotional mirror
      </Badge>
      <h1 className="bg-gradient-to-r from-amber-100 via-white to-cyan-100 bg-clip-text text-5xl font-black tracking-normal text-transparent sm:text-7xl">
        先贤捞捞
      </h1>
      <p className="mt-4 text-xl font-semibold text-white/88 sm:text-2xl">从人类历史里捞几个懂你的人。</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
        你不是第一个想摆烂的人。输入一句丧话，看看历史上谁也这么过。
      </p>
    </motion.section>
  );
}
