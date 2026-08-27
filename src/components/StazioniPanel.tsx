"use client";

import { CloudSun } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { formatDecimal, formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { StazioniData } from "@/lib/stazioni-wfs";
import { useOpenData } from "@/lib/use-open-data";

export function StazioniPanel() {
  const t = useT();
  const state = useOpenData<StazioniData>("/api/stazioni");

  if (!isFeatureEnabled("stazioni_regionali")) return null;

  return (
    <section id="stazioni-regionali" className="mb-4">
      <PanelHeading
        title={t("Stazioni meteo-idro regionali")}
        description={t(
          "Stazioni della rete regionale (WFS) nel bounding box comunale, con gli ultimi valori pubblicati.",
        )}
        icon={CloudSun}
      />
      <PanelState
        state={state}
        title={t("Stazioni regionali")}
        loadingLabel={t("Caricamento stazioni…")}
        emptyMessage={t("Nessuna stazione nel bbox comunale.")}
      >
        {(data) => (
          <>
            <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
              <KpiCard
                label={t("Stazioni")}
                value={formatInteger(data.stazioni.length)}
                icon={CloudSun}
                variant="info"
              />
            </div>
            <div className="overflow-x-auto panel">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <caption className="sr-only">{t("Stazioni WFS")}</caption>
                <thead className="bg-[#e8f2fc] text-[#17324d]">
                  <tr>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Stazione")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Codice")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Valore")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Quando")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.stazioni.map((s, i) => (
                    <tr key={`${s.codice}-${i}`} className="border-t border-[#eef2f5]">
                      <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                        {s.nome || s.tipo}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">{s.codice || "—"}</td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {s.valore != null
                          ? `${formatDecimal(s.valore, 1)} ${s.unita}`.trim()
                          : "—"}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">{s.quando || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PanelState>
    </section>
  );
}
