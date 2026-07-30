"use client";

import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { translate } from "@/lib/i18n/translate";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { LoadingBlock } from "@/components/ui";
import { useFocusTrap } from "@/lib/focus-trap";

const AssistenteChat = dynamic(() => import("@/components/AssistenteChat"), {
  ssr: false,
  loading: () => (
    <LoadingBlock
      label={translate(getFormatLocale(), "Caricamento assistente…")}
    />
  ),
});

/** Pulsante flottante + pannello chat per l'assistente RAG. */
export function AssistenteFab() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const dialogId = useId();

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window === "undefined") return;
    if (window.location.hash === "#assistente") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  useFocusTrap(panelRef, open, close);

  useEffect(() => {
    const fromHash = () => {
      if (window.location.hash.replace(/^#/, "") === "assistente") {
        setOpen(true);
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    if (window.matchMedia("(max-width: 640px)").matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function openPanel() {
    setOpen(true);
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#assistente") {
      window.history.replaceState(null, "", "#assistente");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="fixed bottom-5 right-4 z-[900] inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--pa-primary)] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[var(--pa-primary-hover)] sm:bottom-6 sm:right-6"
        style={{ color: "#ffffff" }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <Bot size={20} aria-hidden strokeWidth={2.25} />
        {t("Assistente")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[950] flex items-end justify-end sm:items-end sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(23,50,77,0.45)]"
            aria-label={t("Chiudi assistente")}
            onClick={close}
          />
          <div
            id={dialogId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative z-[1] flex h-[min(88vh,720px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--pa-border)] bg-white shadow-2xl sm:h-[min(80vh,680px)] sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3">
              <div className="min-w-0">
                <p
                  id={titleId}
                  className="m-0 flex items-center gap-2 text-sm font-bold text-[var(--pa-ink)]"
                >
                  <Bot
                    size={18}
                    className="text-[var(--pa-primary)]"
                    aria-hidden
                  />
                  {t("Assistente dati")}
                </p>
                <p className="m-0 mt-0.5 text-xs text-[var(--pa-muted)]">
                  {t("Domande sui dati aperti del cruscotto")}
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={close}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--pa-border)] bg-white text-[var(--pa-ink)]"
                aria-label={t("Chiudi")}
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <AssistenteChat compact />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
