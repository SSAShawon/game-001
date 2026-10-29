import * as React from "react";
import clsx from "clsx";

const variantClasses: Record<string, string> = {
  default: "border-zinc-700 text-zinc-300",
  owned: "border-orchid/50 text-orange-200 bg-orchid/10",
  available: "border-glacial/50 text-cyan-200 bg-glacial/10",
  locked: "border-zinc-700 text-zinc-500",
  future: "border-zinc-800 text-zinc-600",
  active: "border-[#4ade80]/50 text-[#86efac] bg-[#4ade80]/10",
  closed: "border-zinc-700 text-zinc-500",
  danger: "border-zinc-700 text-zinc-400",
  common: "border-zinc-700 text-zinc-300",
  uncommon: "border-glacial/60 text-glacial",
  rare: "border-orchid/60 text-orchid",
  epic: "border-lavender/60 text-lavender",
  legendary: "border-amber/60 text-amber",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantClasses;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
    />
  );
}
