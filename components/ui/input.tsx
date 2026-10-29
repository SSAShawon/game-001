import * as React from "react";
import clsx from "clsx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={clsx(
        "flex h-10 w-full rounded-md border border-zinc-600 bg-[#12141b] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-glacial transition-colors",
        className
      )}
      {...props}
    />
  );
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={clsx(
        "flex min-h-[80px] w-full rounded-md border border-zinc-600 bg-[#12141b] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-glacial transition-colors",
        className
      )}
      {...props}
    />
  );
}
