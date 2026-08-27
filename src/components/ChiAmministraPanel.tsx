"use client";

import { Landmark } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { AmministratoriData } from "@/lib/dait";
import { useOpenData } from "@/lib/use-open-data";

export function ChiAmministraPanel() {
  const t = useT();
  const state = useOpenData<AmministratoriData>("/api/amministratori");

  if (!isFeatureEnabled("chi_amministra")) return null;

  return (
    <section id="chi-amministra" className="mb-4">
      <PanelHeading
        title={t("Chi amministra")}
        description={t(
          "Sindaco, giunta e consiglio comunale dall’anagrafe DAIT del Ministero dell’Interno (CSV provinciale).",
        )}
        icon={Landmark}
      />
      <PanelState
        state={state}
        title={t("Amministratori locali")}
        loadingLabel={t("Caricamento amministratori…")}
        emptyMessage={t("Nessun amministratore trovato per questo comune.")}
      >
        {(data) => {
          const sindaco = data.persone.find((p) =>
            /^sindaco$/i.test(p.carica.trim()),
          );
          return (
            <>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                <KpiCard
                  label={t("Sindaco")}
                  value={
                    sindaco
                      ? `${sindaco.nome} ${sindaco.cognome}`.trim()
                      : "—"
                  }
                  hint={sindaco?.lista || undefined}
                  icon={Landmark}
                  variant="info"
                />
                <KpiCard
                  label={t("Amministratori")}
                  value={formatInteger(data.persone.length)}
                />
              </div>
              <div className="overflow-x-auto panel">
                <table className="min-w-full text-left text-xs sm:text-sm">
                  <caption className="sr-only">
                    {t("Amministratori locali DAIT")}
                  </caption>
                  <thead className="bg-[#e8f2fc] text-[#17324d]">
                    <tr>
                      <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {t("Carica")}
                      </th>
                      <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {t("Nome")}
                      </th>
                      <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {t("Lista")}
                      </th>
                      <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {t("Nomina")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.persone.map((p, i) => (
                      <tr
                        key={`${p.carica}-${p.cognome}-${i}`}
                        className="border-t border-[#eef2f5]"
                      >
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">{p.carica}</td>
                        <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                          {p.nome} {p.cognome}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {p.lista || "—"}
                        </td>
                        <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                          {p.dataNomina || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.url ? (
                <p className="mb-0 mt-2 text-xs text-[var(--pa-muted)]">
                  <a href={data.url} target="_blank" rel="noopener noreferrer">
                    {t("CSV provinciale DAIT")}
                  </a>
                </p>
              ) : null}
            </>
          );
        }}
      </PanelState>
    </section>
  );
}
