"use client";

import dynamic from "next/dynamic";
import { Waves } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, LoadingBlock, PanelHeading } from "@/components/ui";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { translate } from "@/lib/i18n/translate";
import type { RischioData } from "@/lib/rischio";
import { useOpenData } from "@/lib/use-open-data";

const BarChart = dynamic(
  () => import("@/components/Charts").then((m) => m.BarChart),
  {
    ssr: false,
    loading: () => (
      <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} />
    ),
  },
);

export function RischioPanel() {
  const t = useT();
  const state = useOpenData<RischioData>("/api/rischio");

  return (
    <div className="mt-4 panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
        <PanelHeading
          title={t("Rischio territoriale")}
          description={t(
            "Dissesto idrogeologico ed erosione costiera — indicatori ISPRA IdroGEO a scala comunale.",
          )}
          icon={Waves}
          className="mb-0"
        />
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <PanelState
          state={state}
          title={t("Dati IdroGEO non disponibili")}
          emptyHint={t(
            "Gli indicatori di rischio territoriale non sono al momento raggiungibili. Il resto del cruscotto resta consultabile.",
          )}
          loadingLabel={t("Caricamento rischio…")}
        >
          {(data) => {
            const pctP3P4 = data.frane?.pctP3P4 ?? null;
            const popFrane =
              data.frane?.espostiRischioElevato.popolazione ?? null;
            const popAlluvMedia =
              data.alluvioni?.scenari.media.popolazione ?? null;
            const kmErosione = data.erosioneCostiera?.kmErosione ?? null;

            const franeClassi = data.frane?.classi;
            const franeLabels = ["P1", "P2", "P3", "P4"];
            const franeValues = franeClassi
              ? [
                  franeClassi.P1 ?? 0,
                  franeClassi.P2 ?? 0,
                  franeClassi.P3 ?? 0,
                  franeClassi.P4 ?? 0,
                ]
              : null;
            const hasFraneChart =
              franeValues != null && franeValues.some((v) => v > 0);

            const alluv = data.alluvioni?.scenari;
            const hasAlluvChart = Boolean(
              alluv &&
                [
                  alluv.elevata.popolazione,
                  alluv.media.popolazione,
                  alluv.bassa.popolazione,
                  alluv.elevata.edifici,
                  alluv.media.edifici,
                  alluv.bassa.edifici,
                ].some((v) => v != null && v > 0),
            );

            const erosione = data.erosioneCostiera;
            const hasErosione =
              erosione != null &&
              [erosione.kmErosione, erosione.kmAvanzamento, erosione.kmStabile]
                .filter((v): v is number => v != null)
                .some((v) => v > 0);

            return (
              <>
                <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                  <KpiCard
                    label={t("Territorio frane P3+P4")}
                    value={
                      pctP3P4 != null ? formatPercent(pctP3P4) : "n.d."
                    }
                    hint={t("Pericolosità elevata + molto elevata")}
                    variant="warning"
                  />
                  <KpiCard
                    label={t("Popolazione rischio frana elevato")}
                    value={
                      popFrane != null ? formatInteger(popFrane) : "n.d."
                    }
                    hint={t("Esposti in P3+P4")}
                  />
                  <KpiCard
                    label={t("Popolazione rischio alluvione (media)")}
                    value={
                      popAlluvMedia != null
                        ? formatInteger(popAlluvMedia)
                        : "n.d."
                    }
                    hint={t("Scenario HPM / tempo di ritorno medio")}
                  />
                  <KpiCard
                    label={t("Costa in erosione")}
                    value={
                      kmErosione != null
                        ? `${formatDecimal(kmErosione, 2)} km`
                        : "n.d."
                    }
                    hint={t("Dinamica litoranea ISPRA")}
                    variant="warning"
                  />
                </div>

                <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
                  {hasFraneChart ? (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-[var(--pa-ink)]">
                        {t("Superficie per classe di pericolosità frana")}
                      </h3>
                      <BarChart
                        labels={franeLabels}
                        datasets={[
                          {
                            label: t("km²"),
                            data: franeValues!,
                            color: "#C0392B",
                          },
                        ]}
                      />
                    </div>
                  ) : null}

                  {hasAlluvChart && alluv ? (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-[var(--pa-ink)]">
                        {t("Esposti per scenario alluvione")}
                      </h3>
                      <BarChart
                        labels={[
                          t("Elevata (HPH)"),
                          t("Media (HPM)"),
                          t("Bassa (HPL)"),
                        ]}
                        datasets={[
                          {
                            label: t("Popolazione"),
                            data: [
                              alluv.elevata.popolazione ?? 0,
                              alluv.media.popolazione ?? 0,
                              alluv.bassa.popolazione ?? 0,
                            ],
                            color: "#0066CC",
                          },
                          {
                            label: t("Edifici"),
                            data: [
                              alluv.elevata.edifici ?? 0,
                              alluv.media.edifici ?? 0,
                              alluv.bassa.edifici ?? 0,
                            ],
                            color: "#5B2C6F",
                          },
                        ]}
                      />
                    </div>
                  ) : null}
                </div>

                {hasErosione && erosione ? (
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--pa-ink)]">
                      {t("Dinamica della costa (km)")}
                    </h3>
                    <BarChart
                      labels={[
                        t("Erosione"),
                        t("Avanzamento"),
                        ...(erosione.kmStabile != null
                          ? [t("Stabile")]
                          : []),
                      ]}
                      datasets={[
                        {
                          label: t("km"),
                          data: [
                            erosione.kmErosione ?? 0,
                            erosione.kmAvanzamento ?? 0,
                            ...(erosione.kmStabile != null
                              ? [erosione.kmStabile]
                              : []),
                          ],
                          color: [
                            "#C0392B",
                            "#27AE60",
                            ...(erosione.kmStabile != null
                              ? ["#7F8C8D"]
                              : []),
                          ],
                        },
                      ]}
                    />
                    <p className="mt-1 text-xs text-[var(--pa-muted)]">
                      {t(
                        "L’erosione è evidenziata rispetto ad avanzamento e tratti stabili.",
                      )}
                    </p>
                  </div>
                ) : null}

                {data.confronto &&
                (data.confronto.provincia ||
                  data.confronto.regione ||
                  data.confronto.italia) ? (
                  <div className="mb-3 overflow-x-auto">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--pa-ink)]">
                      {t("Confronto territoriale (frane P3+P4)")}
                    </h3>
                    <table className="w-full min-w-[28rem] border-collapse text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
                      <thead>
                        <tr className="border-b border-[var(--pa-border)] text-[var(--pa-muted)]">
                          <th scope="col" className="py-1.5 pr-3 font-medium">
                            {t("Livello")}
                          </th>
                          <th scope="col" className="py-1.5 pr-3 font-medium">
                            {t("% territorio")}
                          </th>
                          <th scope="col" className="py-1.5 font-medium">
                            {t("Popolazione")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(
                          [
                            ["Provincia", data.confronto.provincia],
                            ["Regione", data.confronto.regione],
                            ["Italia", data.confronto.italia],
                          ] as const
                        ).map(([fallback, row]) =>
                          row ? (
                            <tr
                              key={fallback}
                              className="border-b border-[var(--pa-border)]/60"
                            >
                              <td className="py-1.5 pr-3">
                                {row.nome ?? t(fallback)}
                              </td>
                              <td className="py-1.5 pr-3">
                                {row.pctFraneP3P4 != null
                                  ? formatPercent(row.pctFraneP3P4)
                                  : "n.d."}
                              </td>
                              <td className="py-1.5">
                                {row.popFraneP3P4 != null
                                  ? formatInteger(row.popFraneP3P4)
                                  : "n.d."}
                              </td>
                            </tr>
                          ) : null,
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)]">
                  {t("Fonte:")}{" "}
                  {state.fonte ??
                    t(
                      "ISPRA — Piattaforma IdroGEO / Rapporto Dissesto idrogeologico in Italia (CC BY)",
                    )}
                  {state.edizione ? ` · ${state.edizione}` : ""}
                </p>
              </>
            );
          }}
        </PanelState>
      </div>
    </div>
  );
}
