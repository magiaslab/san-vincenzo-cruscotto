"use client";

import { Recycle } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, OutlineLink, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { RifiutiAgenziaData } from "@/lib/rifiuti-agenzia";
import { useOpenData } from "@/lib/use-open-data";

export function RifiutiAgenziaPanel() {
  const t = useT();
  const state = useOpenData<RifiutiAgenziaData>("/api/rifiuti-agenzia");

  if (!isFeatureEnabled("rifiuti_agenzia_regionale")) return null;

  return (
    <section id="rifiuti-agenzia" className="mb-4">
      <PanelHeading
        title={t("Agenzia regionale rifiuti")}
        description={t(
          "Dati certificati dall’agenzia regionale. L’URL del file si risolve dalla pagina indice, non è in configurazione.",
        )}
        icon={Recycle}
      />
      <PanelState
        state={state}
        title={t("Agenzia regionale rifiuti")}
        loadingLabel={t("Caricamento dati agenzia…")}
        emptyMessage={t("Nessun file o indicatore trovato nella pagina indice.")}
      >
        {(data) => (
          <>
            <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              <KpiCard
                label={data.nome || t("Agenzia")}
                value={
                  data.rdPct != null ? formatPercent(data.rdPct, 2) : "—"
                }
                hint={data.anno ? `${t("Anno")} ${data.anno}` : undefined}
                icon={Recycle}
                variant="success"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {data.pagina ? (
                <OutlineLink href={data.pagina}>
                  {t("Pagina dati comunali")}
                </OutlineLink>
              ) : null}
              {data.fileUrl ? (
                <OutlineLink href={data.fileUrl}>
                  {t("File risolto dalla pagina")}
                </OutlineLink>
              ) : null}
            </div>
          </>
        )}
      </PanelState>
    </section>
  );
}
