"use client";

import { Building2 } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { PanelHeading } from "@/components/ui";
import { formatDecimal } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { OmiData } from "@/lib/omi";
import { useOpenData } from "@/lib/use-open-data";

export function OmiPanel() {
  const t = useT();
  const state = useOpenData<OmiData>("/api/omi");

  return (
    <div className="mt-4 panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
        <PanelHeading
          title={t("Quotazioni immobiliari (OMI)")}
          description={t(
            "Valori di mercato Agenzia delle Entrate per zone OMI — in integrazione.",
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
            "Il collegamento alle quotazioni OMI è previsto come follow-up. Nessun dato inventato.",
          )}
          loadingLabel={t("Caricamento quotazioni OMI…")}
        >
          {(data) => (
            <div>
              {data.semestre ? (
                <p className="mb-3 text-sm text-[var(--pa-muted)]">
                  {t("Semestre")}: {data.semestre}
                </p>
              ) : null}
              {data.zone.length === 0 ? (
                <p className="m-0 text-sm text-[var(--pa-muted)]">
                  {t("Nessuna zona OMI restituita per il comune.")}
                </p>
              ) : (
                <ul className="m-0 list-none space-y-2 p-0">
                  {data.zone.map((z) => (
                    <li
                      key={z.codice}
                      className="rounded-lg border border-[var(--pa-border)] px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-[var(--pa-ink)]">
                        {z.descrizione}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--pa-muted)]">
                        {z.tipologica}
                        {z.minEurMq != null && z.maxEurMq != null
                          ? ` · ${formatDecimal(z.minEurMq, 0)}–${formatDecimal(z.maxEurMq, 0)} €/m²`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </PanelState>
      </div>
    </div>
  );
}
