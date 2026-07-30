"use client";

import type { ReactNode } from "react";
import { DataUnavailable, LoadingBlock } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { hasData, type UseOpenDataState } from "@/lib/use-open-data";

type PanelStateProps<T> = {
  state: UseOpenDataState<T>;
  title: string;
  emptyMessage?: string;
  emptyHint?: string;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
  /** Contenuto extra sotto i dati (note, ecc.), solo se ok. */
  after?: (data: T) => ReactNode;
  className?: string;
};

function formatAggiornato(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(
    getFormatLocale() === "en" ? "en-GB" : "it-IT",
  );
}

/**
 * Cornice loading / empty / dati per pannelli alimentati da `useOpenData`.
 */
export function PanelState<T>({
  state,
  title,
  emptyMessage,
  emptyHint,
  loadingLabel,
  children,
  after,
  className,
}: PanelStateProps<T>) {
  const t = useT();

  if (state.loading) {
    return <LoadingBlock label={loadingLabel ?? t("Caricamento…")} />;
  }

  if (!hasData(state)) {
    const hintParts = [
      emptyHint,
      state.error
        ? t("Errore di rete o risposta non valida. Puoi riprovare.")
        : null,
      state.note,
    ].filter(Boolean);

    return (
      <div className={className}>
        <DataUnavailable
          message={emptyMessage ?? title}
          hint={hintParts.length ? hintParts.join(" ") : undefined}
          action={
            <button
              type="button"
              onClick={() => state.reload()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--pa-border)] bg-white px-3 text-sm font-semibold text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)]"
            >
              {t("Riprova")}
            </button>
          }
        />
        {(state.fonte || state.aggiornato) && (
          <p className="mb-0 mt-2 text-xs text-[var(--pa-muted)]">
            {state.fonte ? (
              <>
                {t("Fonte:")} {state.fonte}
              </>
            ) : null}
            {state.edizione ? ` · ${state.edizione}` : ""}
            {state.aggiornato
              ? ` · ${t("Aggiornato")} ${formatAggiornato(state.aggiornato)}`
              : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {children(state.data)}
      {after?.(state.data)}
      <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
        {t("Fonte:")} {state.fonte}
        {state.edizione ? ` · ${state.edizione}` : ""}
        {state.aggiornato
          ? ` · ${t("Aggiornato")} ${formatAggiornato(state.aggiornato)}`
          : ""}
      </p>
    </div>
  );
}
