import { Badge } from "@/components/ui/badge";
import type { EmotionTag } from "@/lib/types";

const labels: Record<EmotionTag, string> = {
  low_energy: "低能量",
  procrastination: "拖延",
  self_blame: "自责",
  avoidance: "启动困难",
  burnout: "倦怠",
  task_aversion: "任务厌恶",
  meaning_crisis: "意义感低",
  fear_of_failure: "怕失败",
  external_judgment: "外界评价",
  status_loss: "失落",
  overthinking: "想太多",
  need_comfort: "需要安慰",
  need_action: "需要小行动"
};

export function emotionLabel(tag: EmotionTag) {
  return labels[tag] ?? tag;
}

export function EmotionChips({ tags }: { tags: EmotionTag[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} className="border-cyan-200/16 bg-cyan-200/10 text-cyan-50">
          {emotionLabel(tag)}
        </Badge>
      ))}
    </div>
  );
}
