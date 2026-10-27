import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={twMerge(
        clsx("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={twMerge(clsx("flex flex-col gap-1 p-5", className))}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={twMerge(clsx("font-display text-base font-semibold leading-tight text-foreground", className))}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={twMerge(clsx("text-sm text-muted-foreground", className))}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return (
    <div
      data-slot="card-content"
      className={twMerge(clsx("p-5 pt-0", className))}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={twMerge(clsx("flex items-center p-5 pt-0", className))}
      {...props}
    />
  );
}
