import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
          variant === "default" && "bg-amber-300 text-slate-950 shadow-amber hover:bg-amber-200",
          variant === "secondary" && "bg-white/10 text-white hover:bg-white/16",
          variant === "ghost" && "text-white/82 hover:bg-white/10 hover:text-white",
          variant === "outline" && "border border-white/14 bg-white/5 text-white hover:bg-white/10",
          size === "default" && "h-10 px-4 text-sm",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-12 px-5 text-base",
          size === "icon" && "h-10 w-10",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
