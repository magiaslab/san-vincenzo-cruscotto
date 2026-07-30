"use client";

import { Waves } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, PanelHeading } from "@/components/ui";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { RischioData } from "@/lib/rischio";
import { useOpenData } from "@/lib/use-open-data";

export function RischioPanel() {
  const t = useT();
  const state = useOpenData<RischioData>("/api/rischio");

  return (
    <div className="mt-4 panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-3 sm:px-5">
        <PanelHeading
          title={t("Rischio idrogeologico (IdroGEO)")}
          description={t(
            "Layer ISPRA su alluvioni e frane a scala comunale — in integrazione.",
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
            "La fonte open data sarà collegata a breve. Intanto consulta i KPI rischio già presenti sopra (Cruscotto Italia).",
          )}
          loadingLabel={t("Caricamento rischio…")}
        >
          {(data) => (
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              <KpiCard
                label={t("Popolazione P3 alluvioni")}
                value={
                  data.alluvioni?.popP3 != null
                    ? formatInteger(data.alluvioni.popP3)
                    : "n.d."
                }
              />
              <KpiCard
                label={t("Area frane P3+P4")}
                value={
                  data.frane?.areaP3P4Kmq != null
                    ? `${formatDecimal(data.frane.areaP3P4Kmq, 2)} km²`
                    : "n.d."
                }
                hint={
                  data.frane?.areaP3P4Pct != null
                    ? formatPercent(data.frane.areaP3P4Pct)
                    : undefined
                }
              />
              <KpiCard
                label={t("Popolazione frane P3+P4")}
                value={
                  data.frane?.popP3P4 != null
                    ? formatInteger(data.frane.popP3P4)
                    : "n.d."
                }
              />
            </div>
          )}
        </PanelState>
      </div>
    </div>
  );
}
