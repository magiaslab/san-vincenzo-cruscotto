"use client";

import { Flame } from "lucide-react";
import { PanelState } from "@/components/panel-state";
import { OutlineLink, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { useT } from "@/lib/i18n";
import type { IncendiData } from "@/lib/effis";
import { useOpenData } from "@/lib/use-open-data";

export function IncendiPanel() {
  const t = useT();
  const state = useOpenData<IncendiData>("/api/incendi");

  if (!isFeatureEnabled("incendi")) return null;

  return (
    <section id="incendi" className="mb-4">
      <PanelHeading
        title={t("Rischio incendi (EFFIS)")}
        description={t(
          "Indice FWI e hotspot MODIS di Copernicus EFFIS. L’overlay è sulla mappa comunale.",
        )}
        icon={Flame}
      />
      <PanelState
        state={state}
        title={t("EFFIS")}
        loadingLabel={t("Caricamento EFFIS…")}
        emptyMessage={t("Modulo incendi non disponibile.")}
      >
        {(data) => (
          <div className="panel">
            <p className="mt-0 text-sm text-[var(--pa-muted)]">
              {data.note} {t("Layer WMS")}: {data.fwiLayer}, {data.hotspotLayer}.
            </p>
            <OutlineLink href={data.viewerUrl}>
              {t("Apri il visualizzatore EFFIS")}
            </OutlineLink>
          </div>
        )}
      </PanelState>
    </section>
  );
}
