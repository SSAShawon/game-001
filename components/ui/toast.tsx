"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

let setters: Array<(t: ToastState | null) => void> = [];

export interface ToastState {
  kind: "saving" | "saved" | "error" | "info";
  message?: string;
  duration?: number;
}

export function showToast(toast: Omit<ToastState, "duration"> & { duration?: number }) {
  const state: ToastState = { ...toast, duration: toast.duration ?? 3000 };
  const slice = setters.slice();
  for (let i = 0; i < slice.length; i++) slice[i](state);
  if (state.duration && state.duration > 0) {
    setTimeout(() => {
      const s2 = setters.slice();
      for (let i = 0; i < s2.length; i++) s2[i](null);
    }, state.duration);
  }
}

export function useToast() {
  const [state, setState] = React.useState<ToastState | null>(null);
  React.useEffect(() => {
    setters.push(setState);
    return () => {
      setters = setters.filter((s) => s !== setState);
    };
  }, []);
  const show = React.useCallback((t: Omit<ToastState, "duration"> & { duration?: number }) => {
    showToast(t);
  }, []);
  const hide = React.useCallback(() => setState(null), []);
  return { toast: state, show, hide };
}

export function Toast() {
  const { toast } = useToast();
  if (!toast) return null;

  const Icon =
    toast.kind === "saved" ? CheckCircle2 :
    toast.kind === "error" ? AlertCircle :
    Loader2;

  const color =
    toast.kind === "saved" ? "text-[#4ade80]" :
    toast.kind === "error" ? "text-[#f48fb1]" :
    "text-glacial";

  let label = "Info";
  if (toast.kind === "saving") label = "Saving…";
  if (toast.kind === "saved") label = "Saved";
  if (toast.kind === "error") label = "Save error";

  return (
    <div
      className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border bg-[#12141b] text-zinc-100 shadow-2xl animate-in fade-in slide-in-from-top-2"
    >
      <Icon className={"h-5 w-5 " + color} />
      <div className="text-sm font-medium">
        {label}
        {toast.message ? " — " + toast.message : ""}
      </div>
    </div>
  );
}
