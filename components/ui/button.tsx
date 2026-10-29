import * as React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "accent" | "lavender" | "danger" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

function sizeClass(size: string): string {
  switch (size) {
    case "sm": return "h-9 rounded-md px-3";
    case "lg": return "h-11 px-8";
    case "icon": return "h-10 w-10";
    default: return "h-10 px-4 py-2";
  }
}

function variantClass(variant: string): string {
  switch (variant) {
    case "default": return "bg-glacial text-black hover:bg-[#4fc3e8]";
    case "outline": return "border border-zinc-600 bg-transparent hover:bg-zinc-700 hover:text-zinc-100";
    case "ghost": return "hover:bg-zinc-700 hover:text-zinc-100";
    case "accent": return "bg-orchid text-black hover:bg-[#d48fc0]";
    case "lavender": return "bg-lavender text-black hover:bg-[#9b8df5]";
    case "danger": return "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white";
    case "success": return "bg-[#4ade80] text-black hover:bg-[#3fdd74]";
    default: return "bg-glacial text-black hover:bg-[#4fc3e8]";
  }
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-game",
        variantClass(variant),
        sizeClass(size),
        className
      )}
    />
  );
}
