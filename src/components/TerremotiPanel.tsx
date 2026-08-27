"use client";

import { Activity } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { formatDecimal, formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { TerremotiData } from "@/lib/ingv";
import { useOpenData } from "@/lib/use-open-data";

export function TerremotiPanel() {
  const t = useT();
  const state = useOpenData<TerremotiData>("/api/terremoti");

  if (!isFeatureEnabled("terremoti")) return null;

  return (
    <section id="terremoti" className="mb-4">
      <PanelHeading
        title={t("Terremoti recenti")}
        description={t(
          "Eventi sismici INGV nell’ultimo anno, nel raggio del bounding box comunale.",
        )}
        icon={Activity}
      />
      <PanelState
        state={state}
        title={t("Terremoti INGV")}
        loadingLabel={t("Caricamento terremoti…")}
        emptyMessage={t("Nessun terremoto INGV nel raggio nell’ultimo anno.")}
      >
        {(data) => (
          <>
            <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              <KpiCard
                label={t("Eventi")}
                value={formatInteger(data.eventi.length)}
                hint={`${t("Raggio")} ${formatInteger(data.raggioKm)} km`}
                icon={Activity}
              />
              <KpiCard
                label={t("Magnitudo max")}
                value={
                  data.eventi.reduce(
                    (m, e) => (e.mag != null && (m == null || e.mag > m) ? e.mag : m),
                    null as number | null,
                  ) != null
                    ? formatDecimal(
                        data.eventi.reduce(
                          (m, e) =>
                            e.mag != null && (m == null || e.mag > m) ? e.mag : m,
                          null as number | null,
                        ),
                        1,
                      )
                    : "—"
                }
              />
            </div>
            <div className="overflow-x-auto panel">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <caption className="sr-only">{t("Terremoti INGV")}</caption>
                <thead className="bg-[#e8f2fc] text-[#17324d]">
                  <tr>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Data")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      Mag
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Luogo")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      km
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.eventi.slice(0, 15).map((e) => (
                    <tr key={e.id} className="border-t border-[#eef2f5]">
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {e.quando ? new Date(e.quando).toLocaleString("it-IT") : "—"}
                      </td>
                      <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                        {e.mag != null ? formatDecimal(e.mag, 1) : "—"}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {e.url ? (
                          <a href={e.url} target="_blank" rel="noopener noreferrer">
                            {e.luogo}
                          </a>
                        ) : (
                          e.luogo
                        )}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {e.distanzaKm != null ? formatDecimal(e.distanzaKm, 1) : "—"}
                      </td>
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
