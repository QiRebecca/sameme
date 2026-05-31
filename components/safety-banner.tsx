import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

export function SafetyBanner({ message }: { message: string }) {
  return (
    <Card className="mx-auto mt-8 max-w-3xl border-rose-200/24 bg-rose-300/10 p-5">
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-200 text-rose-950">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">我听见你现在可能很难受。</h2>
          <p className="mt-2 text-sm leading-7 text-white/76">{message}</p>
          <p className="mt-3 text-xs leading-6 text-white/54">
            如果你只是想表达“不想学习/工作”，可以换一句更明确的工作或学习场景重新输入；我会先按安全优先处理。
          </p>
        </div>
      </div>
    </Card>
  );
}
