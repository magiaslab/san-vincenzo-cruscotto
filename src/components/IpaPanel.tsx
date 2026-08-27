"use client";

import { Mail } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { IpaData } from "@/lib/ipa";
import { useOpenData } from "@/lib/use-open-data";

export function IpaPanel() {
  const t = useT();
  const state = useOpenData<IpaData>("/api/ipa");

  if (!isFeatureEnabled("ipa")) return null;

  return (
    <section id="ipa" className="mb-4">
      <PanelHeading
        title={t("Domicili digitali (IPA)")}
        description={t(
          "PEC, codice IPA e codice univoco di fatturazione degli enti del comune.",
        )}
        icon={Mail}
      />
      <PanelState
        state={state}
        title={t("Indice PA")}
        loadingLabel={t("Caricamento IPA…")}
        emptyMessage={t("Nessun ente IPA trovato per questo comune.")}
      >
        {(data) => (
          <>
            <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
              <KpiCard
                label={t("Enti")}
                value={formatInteger(data.enti.length)}
                icon={Mail}
                variant="info"
              />
            </div>
            <div className="overflow-x-auto panel">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <caption className="sr-only">{t("Enti IPA")}</caption>
                <thead className="bg-[#e8f2fc] text-[#17324d]">
                  <tr>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Ente")}
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      IPA
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      PEC
                    </th>
                    <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {t("Codice univoco")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.enti.map((e, i) => (
                    <tr key={`${e.codiceIpa}-${i}`} className="border-t border-[#eef2f5]">
                      <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                        {e.denominazione}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.codiceIpa || "—"}</td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {e.pec ? (
                          <a href={`mailto:${e.pec}`}>{e.pec}</a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {e.codiceUnivoco || "—"}
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
