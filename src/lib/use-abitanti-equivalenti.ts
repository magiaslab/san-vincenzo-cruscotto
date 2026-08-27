"use client";

import { useMemo } from "react";
import {
  fromPresenzeEResidenti,
  perAbitanteEquivalente,
  type AbitantiEquivalenti,
  type PerAbitanteResult,
} from "@/lib/abitanti-equivalenti";
import type { TurismoData } from "@/lib/turismo-flussi";
import { useOpenData } from "@/lib/use-open-data";

function presenzeFromTurismo(data: TurismoData | null): {
  presenze: number | null;
  residenti: number | null;
} {
  if (!data) return { presenze: null, residenti: null };
  const anni = [...(data.annuale ?? [])].sort((a, b) => b.anno - a.anno);
  const top = anni[0];
  return {
    presenze: top && top.presenze > 0 ? top.presenze : null,
    residenti: data.residenti,
  };
}

export function useAbitantiEquivalenti(): {
  loading: boolean;
  den: AbitantiEquivalenti;
} {
  const state = useOpenData<TurismoData>("/api/turismo");
  const den = useMemo(() => {
    const { presenze, residenti } = presenzeFromTurismo(state.data);
    return fromPresenzeEResidenti(presenze, residenti);
  }, [state.data]);

  return { loading: state.loading, den };
}

export function usePerAbitante(
  valore: number | null,
  scala = 1,
  giaPerCapite = false,
): PerAbitanteResult & { loading: boolean } {
  const { loading, den } = useAbitantiEquivalenti();
  if (giaPerCapite) {
    const v =
      typeof valore === "number" && Number.isFinite(valore) ? valore : null;
    const perEq =
      v != null && den.residenti && den.abitantiEquivalenti
        ? (v * den.residenti) / den.abitantiEquivalenti
        : null;
    return {
      perResidente: v,
      perAbitanteEquivalente: perEq,
      disponibile: den.abitantiEquivalenti != null,
      abitantiEquivalenti: den.abitantiEquivalenti,
      abitantiEquivalentiTuristici: den.abitantiEquivalentiTuristici,
      loading,
    };
  }
  const r = perAbitanteEquivalente(valore, {
    residenti: den.residenti,
    presenzeAnnue: den.presenzeAnnue,
    scala,
  });
  return { ...r, loading };
}
