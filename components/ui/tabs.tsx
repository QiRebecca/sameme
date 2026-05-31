"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  className
}: {
  tabs: Array<{ value: string; label: string; content: React.ReactNode }>;
  className?: string;
}) {
  const [active, setActive] = React.useState(tabs[0]?.value);
  const current = tabs.find((tab) => tab.value === active) ?? tabs[0];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-3 rounded-md border border-white/10 bg-black/18 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={cn(
              "rounded px-2 py-2 text-xs font-medium text-white/58 transition",
              active === tab.value && "bg-white/12 text-white shadow-sm"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-[116px] rounded-md border border-white/10 bg-black/12 p-3 text-sm leading-6 text-white/76">
        {current?.content}
      </div>
    </div>
  );
}
