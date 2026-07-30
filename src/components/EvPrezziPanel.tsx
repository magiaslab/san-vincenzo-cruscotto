"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatDecimal } from "@/lib/format";
import {
  DataUnavailable,
  LoadingBlock,
  OutlineLink,
  SolidLink,
} from "@/components/ui";
import type { EvPrezziPayload, EvStationRow } from "@/lib/ev-prezzi";

function PriceCell({
  value,
  display,
  isBest,
}: {
  value: number | null;
  display: string | null;
  isBest: boolean;
}) {
  const t = useT();
  if (value == null) {
    return <span className="text-[var(--pa-muted)]">{t("Non comunicato")}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={isBest ? "font-bold text-[#008758]" : undefined}>
        {display ?? `${formatDecimal(value, 3)} €/kWh`}
      </span>
      {isBest ? (
        <span className="rounded bg-[#008758] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {t("Miglior prezzo")}
        </span>
      ) : null}
    </span>
  );
}

export default function EvPrezziPanel() {
  const t = useT();
  const [data, setData] = useState<EvPrezziPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/ev")
      .then((r) => {
        if (!r.ok) throw new Error("ev");
        return r.json() as Promise<EvPrezziPayload>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare gestori e prezzi EV");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const best = data?.prezzo_min_eur_kwh ?? null;
  const rows = useMemo(() => data?.stazioni ?? [], [data?.stazioni]);

  if (loading) return <LoadingBlock label={t("Caricamento colonnine…")} />;
  if (error) return <DataUnavailable message={error} />;
  if (!data?.disponibile || rows.length === 0) {
    return (
      <DataUnavailable message={t("Nessun punto di ricarica georeferenziato disponibile.")} />
    );
  }

  return (
    <div className="panel overflow-hidden p-0">
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="m-0 flex items-center gap-2">
              <Zap
                size={20}
                className="shrink-0 text-[var(--pa-primary)]"
                strokeWidth={2}
                aria-hidden
              />
              {t("Colonnine EV — gestori e prezzi")}
            </h3>
            <p className="mb-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
              {t(
                "Ordinati per €/kWh crescente quando il prezzo è dichiarato. Badge verde = prezzo migliore tra le stazioni con tariffa nota.",
              )}
              {" · "}
              {data.n_con_prezzo}/{data.n_stazioni} {t("con prezzo dichiarato")}
              {best != null
                ? ` · ${t("Miglior prezzo")}: ${formatDecimal(best, 3)} €/kWh`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SolidLink href={data.fonti.anagrafica.url}>
              {data.fonti.anagrafica.label}
            </SolidLink>
            <OutlineLink href={data.fonti.prezzi.url}>
              {data.fonti.prezzi.label}
            </OutlineLink>
          </div>
        </div>

        <p
          className="mt-3 mb-0 rounded-md border border-[#f0d9a8] bg-[#fff8e8] px-3 py-2 text-xs text-[#5c4a1f] sm:text-sm"
          role="note"
        >
          <strong>{t("Disclaimer")}:</strong> {data.disclaimer}
        </p>
        {data.note ? (
          <p className="mt-2 mb-0 text-xs text-[var(--pa-muted)]">{data.note}</p>
        ) : null}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
          <thead className="bg-[#e8f2fc]">
            <tr>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Stazione")}</th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Gestore")}</th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Potenza")}</th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Corrente")}</th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Prezzo")}</th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Stato")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s: EvStationRow) => {
              const isBest =
                s.prezzo_eur_kwh != null &&
                best != null &&
                s.prezzo_eur_kwh === best;
              return (
                <tr
                  key={s.id}
                  className={`border-t border-[#eef2f5] ${
                    isBest ? "bg-[#f0faf4]" : ""
                  }`}
                >
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <strong>
                      {s.nome || s.indirizzo || t("Punto di ricarica")}
                    </strong>
                    {s.nome && s.indirizzo ? (
                      <>
                        <br />
                        <span className="text-[#5b6f82]">{s.indirizzo}</span>
                      </>
                    ) : null}
                    {s.n_punti > 1 ? (
                      <>
                        <br />
                        <span className="text-[#5b6f82]">
                          {s.n_punti} {t("punti EVSE")}
                        </span>
                      </>
                    ) : null}
                    {s.detail_url ? (
                      <>
                        <br />
                        <a
                          href={s.detail_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--pa-primary)] underline"
                        >
                          {t("Dettaglio prezzo")}
                        </a>
                      </>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {s.gestore ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {s.potenza_kw != null
                      ? `${formatDecimal(s.potenza_kw, 0)} kW`
                      : "—"}
                    {s.categoria ? (
                      <span className="text-[#5b6f82]"> · {s.categoria}</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {s.corrente || "—"}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    <PriceCell
                      value={s.prezzo_eur_kwh}
                      display={s.prezzo_display}
                      isBest={isBest}
                    />
                    {s.prezzo_verificato ? (
                      <>
                        <br />
                        <span className="text-[10px] text-[#5b6f82]">
                          {t("Verificato")}: {s.prezzo_verificato}
                        </span>
                      </>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {s.stato ?? (s.attivo ? t("Attivo") : "—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="m-0 border-t border-[#eef2f5] px-3 py-2 text-xs text-[#5b6f82] sm:px-4">
        {t("Anagrafica")}: {data.fonti.anagrafica.label}. {t("Prezzi")}:{" "}
        {data.fonti.prezzi.label}. {t("Aggiornato")}:{" "}
        {new Date(data.aggiornato_at).toLocaleString("it-IT")}
      </p>
    </div>
  );
}
