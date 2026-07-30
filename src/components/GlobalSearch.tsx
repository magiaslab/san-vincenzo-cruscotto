"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { searchCatalog, type SearchEntry } from "@/lib/search-catalog";
import { useT } from "@/lib/i18n";

type Props = {
  onNavigate: (tabId: string) => void;
  /** Variante a tutta larghezza sotto la topbar (solo mobile). */
  mobile?: boolean;
};

export function GlobalSearch({ onNavigate, mobile = false }: Props) {
  const t = useT();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const inputId = useId();

  const results = useMemo(() => searchCatalog(q), [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    if (mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobile]);

  function choose(entry: SearchEntry) {
    onNavigate(entry.tab);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQ("");
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[active] ?? results[0]);
    }
  }

  const wrapClass = mobile
    ? "relative w-full"
    : "relative hidden min-w-0 flex-1 sm:block sm:max-w-xs lg:max-w-sm";

  return (
    <div className={wrapClass}>
      <label htmlFor={inputId} className="sr-only">
        {t("Cerca nel cruscotto")}
      </label>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pa-muted)]"
          aria-hidden
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={onKeyDown}
          placeholder={
            mobile ? t("Cerca sezioni e servizi…") : t("Cerca… (Ctrl+K)")
          }
          autoComplete="off"
          role="combobox"
          aria-expanded={open && q.trim().length >= 2}
          aria-controls={listId}
          aria-autocomplete="list"
          className="min-h-11 w-full rounded-lg border border-[var(--pa-border)] bg-white py-2 pl-9 pr-9 text-sm text-[var(--pa-ink)] placeholder:text-[var(--pa-muted)]"
        />
        {q ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 inline-flex min-h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded text-[var(--pa-muted)] hover:bg-[var(--pa-surface-soft)]"
            aria-label={t("Cancella ricerca")}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
          >
            <X size={14} aria-hidden />
          </button>
        ) : null}
      </div>

      {open && q.trim().length >= 2 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-72 overflow-auto rounded-xl border border-[var(--pa-border)] bg-white py-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--pa-muted)]">
              {t("Nessun risultato")}
            </li>
          ) : (
            results.map((entry, i) => (
              <li key={entry.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  className={`flex w-full flex-col px-3 py-2 text-left text-sm ${
                    i === active
                      ? "bg-[var(--pa-surface-soft)]"
                      : "hover:bg-[var(--pa-surface-soft)]"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(entry)}
                >
                  <span className="font-semibold text-[var(--pa-ink)]">
                    {t(entry.label)}
                  </span>
                  <span className="text-xs text-[var(--pa-muted)]">
                    {t(entry.hint)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
