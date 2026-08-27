/**
 * Denominatore condiviso: residenti anagrafici vs abitanti equivalenti
 * (residenti + presenze turistiche / 365).
 *
 * In un comune balneare i kg di rifiuti o le farmacie «per residente»
 * sembrano anomalie: il carico reale include i turisti.
 */
export type AbitantiEquivalenti = {
  residenti: number | null;
  presenzeAnnue: number | null;
  /** presenze ÷ 365 */
  abitantiEquivalentiTuristici: number | null;
  /** residenti + turistici */
  abitantiEquivalenti: number | null;
};

export type PerAbitanteOpts = {
  residenti: number | null;
  presenzeAnnue: number | null;
  /** Moltiplicatore (es. 1000 per «ogni 1.000 abitanti»). Default 1. */
  scala?: number;
};

export type PerAbitanteResult = {
  perResidente: number | null;
  perAbitanteEquivalente: number | null;
  disponibile: boolean;
  abitantiEquivalenti: number | null;
  abitantiEquivalentiTuristici: number | null;
};

export function fromPresenzeEResidenti(
  presenzeAnnue: number | null,
  residenti: number | null,
): AbitantiEquivalenti {
  const res =
    typeof residenti === "number" && residenti > 0 ? residenti : null;
  const pres =
    typeof presenzeAnnue === "number" && presenzeAnnue > 0
      ? presenzeAnnue
      : null;
  const turistici = pres != null ? pres / 365 : null;
  const eq =
    res != null && turistici != null ? res + turistici : null;
  return {
    residenti: res,
    presenzeAnnue: pres,
    abitantiEquivalentiTuristici: turistici,
    abitantiEquivalenti: eq,
  };
}

/**
 * Divide `valore` sia per i residenti sia per gli abitanti equivalenti.
 * `disponibile` è false se mancano le presenze: in quel caso
 * `perAbitanteEquivalente` è null e il chiamante mostra solo il dato attuale.
 */
export function perAbitanteEquivalente(
  valore: number | null,
  opts: PerAbitanteOpts,
): PerAbitanteResult {
  const den = fromPresenzeEResidenti(opts.presenzeAnnue, opts.residenti);
  const scala = opts.scala && opts.scala > 0 ? opts.scala : 1;
  const v = typeof valore === "number" && Number.isFinite(valore) ? valore : null;

  const perResidente =
    v != null && den.residenti
      ? (v / den.residenti) * scala
      : null;
  const perEq =
    v != null && den.abitantiEquivalenti
      ? (v / den.abitantiEquivalenti) * scala
      : null;

  return {
    perResidente,
    perAbitanteEquivalente: perEq,
    disponibile: den.abitantiEquivalenti != null,
    abitantiEquivalenti: den.abitantiEquivalenti,
    abitantiEquivalentiTuristici: den.abitantiEquivalentiTuristici,
  };
}

export const NOTA_ABITANTI_EQUIVALENTI =
  "Per residente = popolazione anagrafica. Per abitante equivalente = residenti + presenze turistiche / 365. In un comune turistico il secondo dato descrive meglio il carico sui servizi.";
