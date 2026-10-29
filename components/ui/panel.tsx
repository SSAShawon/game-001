import * as React from "react";
import { X } from "lucide-react";

import clsx from "clsx";
import { Button } from "./button";

export interface PanelProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Panel({
  title,
  subtitle,
  open,
  onClose,
  className,
  children,
}: PanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0 transition-opacity"
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative z-10 w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-[#12141b] shadow-2xl text-zinc-100",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-[#12141b]/80">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h2>
            {subtitle && (
              <p className="text-xs text-zinc-400">{subtitle}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
