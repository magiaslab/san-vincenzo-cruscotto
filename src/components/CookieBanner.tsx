"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useId, useRef, useState } from "react";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "sv-cruscotto-cookie-consent";

type Consent = "accepted" | "essential";

export function CookieBanner() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const firstBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    firstBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  function save(value: Consent) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() }),
      );
      window.dispatchEvent(new Event("sv-cookie-consent"));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-x-0 bottom-0 z-[1000] border-t border-[var(--pa-border)] bg-[var(--pa-surface)] p-4 shadow-[0_-8px_24px_rgba(23,50,77,0.12)] sm:p-5"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-[var(--pa-ink)]">
            <Cookie
              size={20}
              className="shrink-0 text-[var(--pa-primary)]"
              aria-hidden
            />
            <h2 id={titleId} className="m-0 text-base font-bold">
              {t("Informativa cookie")}
            </h2>
          </div>
          <p
            id={descId}
            className="m-0 text-sm leading-relaxed text-[var(--pa-muted)]"
          >
            {t(
              "Questo sito usa cookie tecnici e memoria locale del browser per salvare le tue preferenze (es. consenso). Per mappe e radar vengono caricati tile da servizi terzi (OpenStreetMap/CARTO, RainViewer). Non usiamo cookie di profilazione pubblicitaria. Continuando puoi accettare tutti i cookie tecnici necessari al funzionamento, oppure solo quelli essenziali.",
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            ref={firstBtnRef}
            type="button"
            onClick={() => save("essential")}
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-primary)] bg-white px-4 py-2 text-sm font-semibold text-[var(--pa-primary)] hover:bg-[var(--pa-surface-soft)]"
          >
            {t("Solo essenziali")}
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--pa-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--pa-primary-hover)]"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
