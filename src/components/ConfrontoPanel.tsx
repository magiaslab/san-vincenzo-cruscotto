"use client";

import { GitCompare } from "lucide-react";
import { DualPerCapite, NotaAbitantiEquivalenti } from "@/components/DualPerCapite";
import { PanelState } from "@/components/panel-state";
import { PanelHeading, SectionIntro } from "@/components/ui";
import { COMUNE } from "@/lib/comune-config";
import { ISTAT_CODE } from "@/lib/constants";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { useOpenData } from "@/lib/use-open-data";

type ConfrontoPayload = {
  comuni: Array<{
    istat: string;
    nome: string;
    popolazione: number | null;
    etaMedia: number | null;
    indiceVecchiaia: number | null;
    rdPct: number | null;
    rifiutiKgAb: number | null;
    redditoMedio: number | null;
    errore: string | null;
  }>;
};

export function ConfrontoPanel() {
  const t = useT();
  const state = useOpenData<ConfrontoPayload>("/api/confronto");

  if (COMUNE.comuni_confronto.length === 0) return null;

  return (
    <section>
      <SectionIntro
        title={t("Confronto tra comuni")}
        description={t(
          "Stessi indicatori AgID (popolazione, età, rifiuti, redditi) affiancati per i comuni vicini configurati.",
        )}
      />
      <PanelHeading
        title={t("Indicatori a confronto")}
        description={t("Fonte: Cruscotto Italia (AgID), filtro per codice ISTAT.")}
        icon={GitCompare}
      />
      <PanelState
        state={state}
        title={t("Confronto")}
        loadingLabel={t("Caricamento confronto…")}
        emptyMessage={t("Nessun comune di confronto configurato.")}
      >
        {(data) => (
          <>
            <div className="overflow-x-auto panel">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <caption className="sr-only">{t("Confronto comuni")}</caption>
                <thead className="bg-[#e8f2fc] text-[#17324d]">
                  <tr>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Comune")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Popolazione")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Età media")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Vecchiaia")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      RD %
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Rifiuti kg/ab")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Reddito")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.comuni.map((c) => {
                    const self = c.istat === ISTAT_CODE;
                    return (
                      <tr
                        key={c.istat}
                        className={`border-t border-[#eef2f5] ${self ? "bg-[color-mix(in_srgb,var(--pa-primary)_8%,white)]" : ""}`}
                      >
                        <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                          {c.nome}
                          {self ? ` (${t("questo comune")})` : ""}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {c.popolazione != null ? formatInteger(c.popolazione) : "—"}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {c.etaMedia != null ? formatDecimal(c.etaMedia, 1) : "—"}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {c.indiceVecchiaia != null
                            ? formatDecimal(c.indiceVecchiaia, 1)
                            : "—"}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {c.rdPct != null ? formatPercent(c.rdPct, 1) : "—"}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {self ? (
                            <DualPerCapite
                              valore={c.rifiutiKgAb}
                              unita="kg/ab"
                              giaPerCapite
                            />
                          ) : c.rifiutiKgAb != null ? (
                            `${formatInteger(c.rifiutiKgAb)} kg/ab`
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {c.redditoMedio != null
                            ? formatInteger(c.redditoMedio)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <NotaAbitantiEquivalenti />
          </>
        )}
      </PanelState>
    </section>
  );
}
