/**
 * Contratto comune per le route open-data (turismo, rischio, omi, …).
 * Le API rispondono sempre HTTP 200: `ok: false` = empty-state, non crash.
 */

export type OpenDataResult<T> = {
  ok: boolean;
  data: T | null;
  fonte: string;
  aggiornato: string;
  /** Edizione/anno del dataset, se applicabile. */
  edizione?: string;
  note?: string | null;
  error?: string | null;
};

export function openDataOk<T>(
  data: T,
  meta: {
    fonte: string;
    aggiornato?: string;
    edizione?: string;
    note?: string | null;
  },
): OpenDataResult<T> {
  return {
    ok: true,
    data,
    fonte: meta.fonte,
    aggiornato: meta.aggiornato ?? new Date().toISOString(),
    edizione: meta.edizione,
    note: meta.note ?? null,
    error: null,
  };
}

export function openDataEmpty<T = never>(
  meta: {
    fonte: string;
    aggiornato?: string;
    edizione?: string;
    note?: string | null;
    error?: string | null;
  },
): OpenDataResult<T> {
  return {
    ok: false,
    data: null,
    fonte: meta.fonte,
    aggiornato: meta.aggiornato ?? new Date().toISOString(),
    edizione: meta.edizione,
    note: meta.note ?? null,
    error: meta.error ?? null,
  };
}

export function isOpenDataResult(value: unknown): value is OpenDataResult<unknown> {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.ok === "boolean" && "data" in v && typeof v.fonte === "string";
}
