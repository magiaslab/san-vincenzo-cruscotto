"use client";

import { Waves } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { KpiCard, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { PgraData } from "@/lib/pgra";
import { useOpenData } from "@/lib/use-open-data";

export function PgraPanel() {
  const t = useT();
  const state = useOpenData<PgraData>("/api/pgra");

  if (!isFeatureEnabled("pericolosita_idraulica")) return null;

  return (
    <section id="pgra" className="mb-4">
      <PanelHeading
        title={t("Pericolosità idraulica PAI/PGRA")}
        description={t(
          "Conteggio delle feature ArcGIS che intersecano il bounding box comunale (alluvioni e frane).",
        )}
        icon={Waves}
      />
      <PanelState
        state={state}
        title={t("PAI / PGRA")}
        loadingLabel={t("Caricamento pericolosità…")}
        emptyMessage={t("Nessun servizio ArcGIS interrogato.")}
      >
        {(data) => (
          <>
            <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {data.layers.map((l) => (
                <KpiCard
                  key={`${l.cartella}-${l.nome}`}
                  label={l.nome}
                  value={formatInteger(l.nFeatures)}
                  hint={l.errore ?? l.cartella}
                  unavailable={Boolean(l.errore)}
                  icon={Waves}
                />
              ))}
            </div>
            <p className="mb-0 text-xs text-[var(--pa-muted)]">{data.note}</p>
          </>
        )}
      </PanelState>
    </section>
  );
}
