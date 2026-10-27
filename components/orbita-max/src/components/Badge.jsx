import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Badge({ children, variant = "default", className, ...props }) {
  const variants = {
    default: "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
    accent: "border-transparent bg-accent/15 text-accent-foreground hover:bg-accent/25",
    success: "border-transparent bg-success/15 text-success hover:bg-success/20",
    warning: "border-transparent bg-warning/15 text-warning-foreground hover:bg-warning/25",
    destructive: "border-transparent bg-destructive/10 text-destructive hover:bg-destructive/15",
    muted: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
    outline: "border-border text-foreground hover:bg-muted/50",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
          variants[variant] || variants.default,
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
