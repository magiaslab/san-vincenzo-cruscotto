"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, LOCALES, LOCALE_META, type Locale } from "@/lib/i18n";

export function LanguageSelector({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = LOCALE_META[locale];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--pa-border)] bg-white px-2.5 text-sm font-semibold text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)] ${
          compact ? "px-2" : "sm:px-3"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("Seleziona lingua")}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden className="text-base leading-none">
          {current.flag}
        </span>
        <span className={compact ? "hidden sm:inline" : undefined}>
          {current.name}
        </span>
        <ChevronDown size={16} aria-hidden className="opacity-70" />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("Lingua")}
          className="absolute right-0 z-50 mt-1 min-w-[10.5rem] list-none rounded-lg border border-[var(--pa-border)] bg-white p-1 shadow-lg"
        >
          {LOCALES.map((code) => {
            const meta = LOCALE_META[code];
            const selected = code === locale;
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-semibold ${
                    selected
                      ? "bg-[var(--pa-primary)] text-white"
                      : "text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)]"
                  }`}
                  style={selected ? { color: "#ffffff" } : undefined}
                  onClick={() => choose(code)}
                >
                  <span aria-hidden className="text-base leading-none">
                    {meta.flag}
                  </span>
                  {meta.name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
