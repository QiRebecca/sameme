import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[112px] w-full resize-none rounded-lg border border-white/12 bg-black/24 px-4 py-3 text-base leading-7 text-white placeholder:text-white/42 focus:outline-none focus:ring-2 focus:ring-cyan-300/70",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
