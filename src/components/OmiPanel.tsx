"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, LoadingBlock, PanelHeading } from "@/components/ui";
import { formatDecimal, formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { translate } from "@/lib/i18n/translate";
import {
  findAbitazioniCivili,
  midRange,
  pickZonaPrincipale,
  type OmiData,
  type OmiZona,
} from "@/lib/omi";
import { useOpenData } from "@/lib/use-open-data";

const LineChart = dynamic(
  () => import("@/components/Charts").then((m) => m.LineChart),
  {
    ssr: false,
    loading: () => (
      <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} />
    ),
  },
);

function formatEurMq(min: number | null, max: number | null): string {
  if (min == null && max == null) return "n.d.";
  if (min != null && max != null) {
    return `${formatDecimal(min, 0)}–${formatDecimal(max, 0)} €/m²`;
  }
  const v = min ?? max;
  return v != null ? `${formatDecimal(v, 0)} €/m²` : "n.d.";
}

function formatEurMqMese(min: number | null, max: number | null): string {
  if (min == null && max == null) return "n.d.";
  if (min != null && max != null) {
    return `${formatDecimal(min, 1)}–${formatDecimal(max, 1)} €/m²/mese`;
  }
  const v = min ?? max;
  return v != null ? `${formatDecimal(v, 1)} €/m²/mese` : "n.d.";
}

function ZonaRow({ zona, t }: { zona: OmiZona; t: (s: string) => string }) {
  const [open, setOpen] = useState(false);
  const civili = findAbitazioniCivili(zona);
  const altre = zona.tipologie.filter((tip) => tip !== civili);

  return (
    <tbody className="border-b border-[var(--pa-border)]/70">
      <tr className="align-top text-sm">
        <td className="py-2.5 pr-2">
          <button
            type="button"
            className="inline-flex max-w-full items-start gap-1.5 text-left font-semibold text-[var(--pa-ink)] hover:underline"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>
              <span className="mr-1.5 rounded bg-[var(--pa-surface-soft)] px-1.5 py-0.5 text-xs font-medium text-[var(--pa-muted)]">
                {zona.codice}
              </span>
              {zona.descrizione}
            </span>
          </button>
        </td>
        <td className="py-2.5 pr-2 whitespace-nowrap">
          {civili
            ? formatEurMq(civili.mercatoMinMq, civili.mercatoMaxMq)
            : "n.d."}
        </td>
        <td className="py-2.5 whitespace-nowrap">
          {civili
            ? formatEurMqMese(civili.affittoMinMqMese, civili.affittoMaxMqMese)
            : "n.d."}
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={3} className="pb-3">
            <div className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface-soft)]/60 px-3 py-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--pa-muted)]">
                {t("Tipologie e stati conservativi")}
              </p>
              <ul className="m-0 list-none space-y-1.5 p-0 text-xs sm:text-sm">
                {zona.tipologie.map((tip, idx) => (
                  <li
                    key={`${zona.codice}-${tip.tipologia}-${tip.statoConservativo}-${idx}`}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                  >
                    <span className="text-[var(--pa-ink)]">
                      {tip.tipologia}
                      {tip.statoConservativo
                        ? ` · ${tip.statoConservativo}`
                        : ""}
                    </span>
                    <span className="shrink-0 text-[var(--pa-muted)]">
                      {formatEurMq(tip.mercatoMinMq, tip.mercatoMaxMq)}
                      {" · "}
                      {formatEurMqMese(
                        tip.affittoMinMqMese,
                        tip.affittoMaxMqMese,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {altre.length === 0 && !civili ? (
                <p className="mb-0 mt-1 text-xs text-[var(--pa-muted)]">
                  {t("Nessuna tipologia in questa zona.")}
                </p>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}

export function OmiPanel() {
  const t = useT();
  const state = useOpenData<OmiData>("/api/omi");

  const derived = useMemo(() => {
    if (!state.data) return null;
    const zona = pickZonaPrincipale(state.data.zone);
    const civili = zona ? findAbitazioniCivili(zona) : null;
    const mercatoMedio = civili
      ? midRange(civili.mercatoMinMq, civili.mercatoMaxMq)
      : null;
    const affittoMedio = civili
      ? midRange(civili.affittoMinMqMese, civili.affittoMaxMqMese)
      : null;
    const storico = state.data.storico ?? [];
    const hasStorico = storico.length >= 2;
    return {
      zona,
      mercatoMedio,
      affittoMedio,
      nZone: state.data.zone.length,
      storico,
      hasStorico,
    };
  }, [state.data]);

  return (
    <div className="mt-4 panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
        <PanelHeading
          title={t("Mercato immobiliare")}
          description={t(
            "Quotazioni OMI (€/m²) per zona — Agenzia Entrate, Osservatorio Mercato Immobiliare.",
          )}
          icon={Building2}
          className="mb-0"
        />
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <PanelState
          state={state}
          title={t("Quotazioni OMI non disponibili")}
          emptyHint={t(
            "Lo snapshot locale delle quotazioni non è disponibile. Il resto del cruscotto resta consultabile.",
          )}
          loadingLabel={t("Caricamento quotazioni OMI…")}
        >
          {(data) => (
            <>
              {data.semestre ? (
                <p className="mb-3 text-sm text-[var(--pa-muted)]">
                  {t("Semestre")}: <strong>{data.semestre}</strong>
                  {derived?.zona ? (
                    <>
                      {" · "}
                      {t("Zona di riferimento")}: {derived.zona.codice}
                    </>
                  ) : null}
                </p>
              ) : null}

              <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                <KpiCard
                  label={t("€/m² abitazioni civili (compravendita)")}
                  value={
                    derived?.mercatoMedio != null
                      ? `${formatDecimal(derived.mercatoMedio, 0)} €/m²`
                      : "n.d."
                  }
                  hint={t("Media min–max zona principale")}
                  icon={Building2}
                  variant="info"
                />
                <KpiCard
                  label={t("€/m²/mese locazione")}
                  value={
                    derived?.affittoMedio != null
                      ? `${formatDecimal(derived.affittoMedio, 1)} €`
                      : "n.d."
                  }
                  hint={t("Abitazioni civili — zona principale")}
                />
                <KpiCard
                  label={t("Zone OMI")}
                  value={
                    derived ? formatInteger(derived.nZone) : "n.d."
                  }
                  hint={t("Delimitazioni nel comune")}
                />
              </div>

              {data.zone.length === 0 ? (
                <p className="m-0 text-sm text-[var(--pa-muted)]">
                  {t("Nessuna zona OMI restituita per il comune.")}
                </p>
              ) : (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full min-w-[36rem] border-collapse text-left">
            <caption className="sr-only">Tabella dati</caption>
                    <thead>
                      <tr className="border-b border-[var(--pa-border)] text-xs uppercase tracking-wide text-[var(--pa-muted)]">
                        <th scope="col" className="py-2 pr-2 font-medium">
                          {t("Zona OMI")}
                        </th>
                        <th scope="col" className="py-2 pr-2 font-medium">
                          {t("Compravendita (abitazioni civili)")}
                        </th>
                        <th scope="col" className="py-2 font-medium">
                          {t("Locazione (abitazioni civili)")}
                        </th>
                      </tr>
                    </thead>
                    {data.zone.map((z) => (
                      <ZonaRow key={z.codice} zona={z} t={t} />
                    ))}
                  </table>
                  <p className="mt-2 text-xs text-[var(--pa-muted)]">
                    {t(
                      "Espandi una zona per vedere le altre tipologie e stati conservativi.",
                    )}
                  </p>
                </div>
              )}

              {derived?.hasStorico ? (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-[var(--pa-ink)]">
                    {t("Trend €/m² abitazioni civili (min–max comunale)")}
                  </h3>
                  <LineChart
                    labels={derived.storico.map((p) => p.semestre)}
                    datasets={[
                      {
                        label: t("Min €/m²"),
                        data: derived.storico.map(
                          (p) => p.abitazioniCivili.minMq,
                        ),
                        color: "#5B2C6F",
                      },
                      {
                        label: t("Max €/m²"),
                        data: derived.storico.map(
                          (p) => p.abitazioniCivili.maxMq,
                        ),
                        color: "#0066CC",
                      },
                    ]}
                  />
                </div>
              ) : null}

              <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
                {t("Fonte:")}{" "}
                {state.fonte ??
                  t(
                    "Agenzia Entrate – OMI (Osservatorio Mercato Immobiliare)",
                  )}
                {state.edizione ? ` · ${t("Semestre")} ${state.edizione}` : ""}
              </p>
            </>
          )}
        </PanelState>
      </div>
    </div>
  );
}
