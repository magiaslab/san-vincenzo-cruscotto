"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Palmtree } from "lucide-react";
import {
  DataUnavailable,
  KpiCard,
  LoadingBlock,
  PanelHeading,
} from "@/components/ui";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { translate } from "@/lib/i18n/translate";
import type { TurismoFlussiPayload } from "@/lib/turismo-flussi";

const LineChart = dynamic(
  () => import("@/components/Charts").then((m) => m.LineChart),
  {
    ssr: false,
    loading: () => (
      <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} />
    ),
  },
);

const DoughnutChart = dynamic(
  () => import("@/components/Charts").then((m) => m.DoughnutChart),
  {
    ssr: false,
    loading: () => (
      <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} />
    ),
  },
);

const BarChart = dynamic(
  () => import("@/components/Charts").then((m) => m.BarChart),
  {
    ssr: false,
    loading: () => (
      <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} />
    ),
  },
);

const MESI_IT = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
] as const;

function formatDelta(pct: number | null, t: (s: string) => string): string | undefined {
  if (pct == null || !Number.isFinite(pct)) return undefined;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${formatDecimal(pct, 1)}% ${t("vs anno prec.")}`;
}

export function TurismoFlussiPanel() {
  const t = useT();
  const [data, setData] = useState<TurismoFlussiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/turismo")
      .then((r) => r.json() as Promise<TurismoFlussiPayload>)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        console.error("Errore caricamento flussi turismo:", err);
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingBlock label={t("Caricamento flussi turistici…")} />;
  }

  if (!data || !data.disponibile) {
    return (
      <DataUnavailable
        message={t("Flussi turistici non disponibili")}
        hint={
          data?.error ||
          t(
            "I dati di arrivi e presenze da Regione Toscana non sono al momento raggiungibili. Il resto del cruscotto resta consultabile.",
          )
        }
      />
    );
  }

  const anno = data.anno;
  const annoPrec = data.annoPrecedente;
  const curPresenze = data.annuale.find((a) => a.anno === anno)?.presenze
    ?? data.mensile.reduce((s, m) => s + m.presenze, 0);
  const curArrivi = data.annuale.find((a) => a.anno === anno)?.arrivi
    ?? data.mensile.reduce((s, m) => s + m.arrivi, 0);

  const mesiLabels = MESI_IT.map((m) => t(m));
  const hasMensile = data.mensile.length === 12;
  const hasProvenienza =
    data.provenienza.italiani > 0 || data.provenienza.stranieri > 0;
  const hasAnnuale = data.annuale.length >= 2;

  return (
    <div className="mt-4 panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
        <PanelHeading
          title={t("Turismo — flussi & stagionalità")}
          description={
            anno
              ? `${t("Arrivi e presenze comunali")} · ${anno}${
                  annoPrec ? ` ${t("vs")} ${annoPrec}` : ""
                }`
              : t("Arrivi e presenze comunali da Regione Toscana (ISTAT)")
          }
          icon={Palmtree}
          className="mb-0"
        />
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          <KpiCard
            label={t("Presenze totali")}
            value={formatInteger(curPresenze)}
            hint={formatDelta(data.deltaPresenzePct, t)}
            trend={
              data.deltaPresenzePct == null
                ? undefined
                : data.deltaPresenzePct >= 0
                  ? "up"
                  : "down"
            }
            trendValue={
              data.deltaPresenzePct != null
                ? `${data.deltaPresenzePct >= 0 ? "+" : ""}${formatDecimal(data.deltaPresenzePct, 1)}%`
                : undefined
            }
            variant="info"
            icon={Palmtree}
          />
          <KpiCard
            label={t("Arrivi totali")}
            value={formatInteger(curArrivi)}
            hint={anno ? `${t("Anno")} ${anno}` : undefined}
          />
          <KpiCard
            label={t("Permanenza media")}
            value={
              data.permanenzaMedia != null
                ? `${formatDecimal(data.permanenzaMedia, 1)} ${t("gg")}`
                : "n.d."
            }
            hint={t("Presenze / arrivi")}
          />
          <KpiCard
            label={t("Pressione turistica")}
            value={
              data.pressioneTuristica != null
                ? formatDecimal(data.pressioneTuristica, 1)
                : "n.d."
            }
            hint={`${t("Presenze / residenti")} (${formatInteger(data.residenti ?? 0)})`}
            variant="success"
          />
        </div>

        {hasMensile ? (
          <div className="mb-4">
            <h4 className="m-0 mb-2 text-sm font-bold text-[var(--pa-ink)]">
              {t("Stagionalità — presenze per mese")}
            </h4>
            <LineChart
              labels={[...mesiLabels]}
              datasets={[
                {
                  label: anno ? `${t("Presenze")} ${anno}` : t("Presenze"),
                  data: data.mensile.map((m) => m.presenze),
                  color: "#0066CC",
                },
                ...(annoPrec
                  ? [
                      {
                        label: `${t("Presenze")} ${annoPrec}`,
                        data: data.mensile.map((m) => m.presenzePrec),
                        color: "#CC7A00",
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        ) : (
          <div className="mb-4">
            <DataUnavailable
              message={t("Stagionalità mensile non disponibile")}
              hint={t(
                "Il dettaglio per mese arriverà quando il file «movimento per comune e mese» è raggiungibile (CKAN o pagina statistiche Regione Toscana).",
              )}
            />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {hasProvenienza ? (
            <div>
              <h4 className="m-0 mb-2 text-sm font-bold text-[var(--pa-ink)]">
                {t("Provenienza (presenze)")}
              </h4>
              <DoughnutChart
                labels={[t("Italiani"), t("Stranieri")]}
                values={[data.provenienza.italiani, data.provenienza.stranieri]}
              />
              <p className="mb-0 mt-2 text-xs text-[var(--pa-muted)]">
                {t("Italiani")} {formatInteger(data.provenienza.italiani)}
                {" · "}
                {t("Stranieri")} {formatInteger(data.provenienza.stranieri)}
                {" · "}
                {t("Quota stranieri")}{" "}
                {formatPercent(
                  data.provenienza.italiani + data.provenienza.stranieri > 0
                    ? (100 * data.provenienza.stranieri) /
                        (data.provenienza.italiani + data.provenienza.stranieri)
                    : null,
                )}
              </p>
            </div>
          ) : null}

          {hasAnnuale ? (
            <div>
              <h4 className="m-0 mb-2 text-sm font-bold text-[var(--pa-ink)]">
                {t("Trend pluriennale")}
              </h4>
              <BarChart
                labels={data.annuale.map((a) => String(a.anno))}
                datasets={[
                  {
                    label: t("Arrivi"),
                    data: data.annuale.map((a) => a.arrivi),
                    color: "#0066CC",
                  },
                  {
                    label: t("Presenze"),
                    data: data.annuale.map((a) => a.presenze),
                    color: "#008758",
                  },
                ]}
              />
            </div>
          ) : null}
        </div>

        {data.note ? (
          <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">{data.note}</p>
        ) : null}

        <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
          {t("Fonte:")} {data.fonte}
          {data.dataset ? ` · ${data.dataset}` : ""}
          {data.aggiornato
            ? ` · ${t("Aggiornato")} ${new Date(data.aggiornato).toLocaleString(getFormatLocale() === "en" ? "en-GB" : "it-IT")}`
            : ""}
        </p>
      </div>
    </div>
  );
}
