"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isOpenDataResult,
  type OpenDataResult,
} from "@/lib/opendata";

export type UseOpenDataState<T> = {
  data: T | null;
  ok: boolean;
  loading: boolean;
  error: boolean;
  fonte: string | null;
  aggiornato: string | null;
  edizione?: string;
  note: string | null;
  reload: () => void;
};

export function hasData<T>(
  s: UseOpenDataState<T>,
): s is UseOpenDataState<T> & { data: T; ok: true } {
  return s.ok && s.data != null && !s.loading;
}

/**
 * Fetch uniforme verso route che espongono `OpenDataResult<T>` (sempre HTTP 200).
 * `ok: false` → empty-state; errore di rete/parse → `error: true`.
 */
export function useOpenData<T>(endpoint: string): UseOpenDataState<T> {
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [payload, setPayload] = useState<OpenDataResult<T> | null>(null);

  const reload = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(false);

    fetch(endpoint, { signal: ac.signal })
      .then(async (res) => {
        const json: unknown = await res.json();
        if (ac.signal.aborted) return;
        if (!isOpenDataResult(json)) {
          setPayload(null);
          setError(true);
          return;
        }
        setPayload(json as OpenDataResult<T>);
        setError(false);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.warn("useOpenData fetch failed", endpoint, err);
        setPayload(null);
        setError(true);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });

    return () => {
      ac.abort();
    };
  }, [endpoint, tick]);

  return {
    data: payload?.data ?? null,
    ok: payload?.ok ?? false,
    loading,
    error,
    fonte: payload?.fonte ?? null,
    aggiornato: payload?.aggiornato ?? null,
    edizione: payload?.edizione,
    note: payload?.note ?? null,
    reload,
  };
}
