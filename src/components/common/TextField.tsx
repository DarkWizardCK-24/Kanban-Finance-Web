"use client";

import { ReactNode, InputHTMLAttributes, useState } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  error?: string | null;
  multiline?: boolean;
  rows?: number;
}

export function TextField({
  label, hint, prefix, suffix, error, className, multiline, rows = 3, ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs font-semibold transition-colors ${
        focused ? "text-accent-cyan" : "text-text-secondary"
      }`}>
        {label}
      </span>
      <div className={`relative flex items-center rounded-xl border bg-dark-card transition-all ${
        error
          ? "border-accent-red"
          : focused
            ? "border-accent-cyan ring-2 ring-accent-cyan/25"
            : "border-dark-border"
      }`}>
        {prefix && (
          <span className="pointer-events-none flex h-full w-10 items-center justify-center text-text-hint">
            {prefix}
          </span>
        )}
        {multiline ? (
          <textarea
            rows={rows}
            placeholder={hint}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`min-h-[90px] flex-1 resize-none bg-transparent py-3 pr-3 text-sm text-text-primary placeholder:text-text-hint focus:outline-none ${prefix ? "" : "pl-3.5"} ${className ?? ""}`}
            {...(rest as any)}
          />
        ) : (
          <input
            placeholder={hint}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`flex-1 bg-transparent py-3.5 pr-3 text-sm text-text-primary placeholder:text-text-hint focus:outline-none ${prefix ? "" : "pl-3.5"} ${className ?? ""}`}
            {...rest}
          />
        )}
        {suffix && (
          <span className="flex h-full items-center pr-3 text-text-hint">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-medium text-accent-red">{error}</p>}
    </label>
  );
}
