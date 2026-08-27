"use client";

import { formatDecimal, formatInteger } from "@/lib/format";
import { NOTA_ABITANTI_EQUIVALENTI } from "@/lib/abitanti-equivalenti";
import { useAbitantiEquivalenti, usePerAbitante } from "@/lib/use-abitanti-equivalenti";

/**
 * Mostra il valore per residente e, se le presenze ci sono, per abitante equivalente.
 */
export function DualPerCapite({
  valore,
  unita,
  scala = 1,
  digits = 0,
  giaPerCapite = false,
}: {
  valore: number | null;
  unita: string;
  scala?: number;
  digits?: number;
  /** `valore` è già «per residente» (es. kg/ab ISPRA), non un totale. */
  giaPerCapite?: boolean;
}) {
  const r = usePerAbitante(valore, scala, giaPerCapite);
  if (valore == null || r.perResidente == null) {
    return <span>—</span>;
  }
  const fmt = (n: number) =>
    digits > 0 ? formatDecimal(n, digits) : formatInteger(n);

  if (!r.disponibile || r.perAbitanteEquivalente == null) {
    return (
      <span>
        {fmt(r.perResidente)} {unita}
      </span>
    );
  }

  return (
    <span>
      {fmt(r.perResidente)} {unita}{" "}
      <span className="block text-xs font-normal text-[var(--pa-muted)]">
        {fmt(r.perAbitanteEquivalente)} {unita} equivalente
      </span>
    </span>
  );
}

export function NotaAbitantiEquivalenti() {
  const { den, loading } = useAbitantiEquivalenti();
  if (loading || den.abitantiEquivalenti == null) return null;
  return (
    <p className="mb-0 mt-2 text-xs leading-relaxed text-[var(--pa-muted)]">
      {NOTA_ABITANTI_EQUIVALENTI} Abitanti equivalenti stimati:{" "}
      {formatInteger(den.abitantiEquivalenti)} (di cui{" "}
      {formatInteger(den.abitantiEquivalentiTuristici ?? 0)} da presenze
      turistiche).
    </p>
  );
}
