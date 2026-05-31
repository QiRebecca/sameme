import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-white/12 bg-black/20 px-4 text-sm text-white placeholder:text-white/42 focus:outline-none focus:ring-2 focus:ring-cyan-300/70",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
