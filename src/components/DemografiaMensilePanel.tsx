"use client";

import { Users } from "lucide-react";
import dynamic from "next/dynamic";
import { PanelState } from "@/components/panel-state";
import { KpiCard, LoadingBlock, PanelHeading } from "@/components/ui";
import { isFeatureEnabled } from "@/lib/comune-config";
import { formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { D7bData } from "@/lib/istat-d7b";
import { useOpenData } from "@/lib/use-open-data";

const LineChart = dynamic(
  () => import("@/components/Charts").then((m) => m.LineChart),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento grafico…" />,
  },
);

const MESI = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];

export function DemografiaMensilePanel() {
  const t = useT();
  const state = useOpenData<D7bData>("/api/demografia-mensile");

  if (!isFeatureEnabled("demografia_mensile")) return null;

  return (
    <section id="demografia-mensile" className="mb-4">
      <PanelHeading
        title={t("Bilancio demografico mensile")}
        description={t(
          "Serie ISTAT D7B: nati, morti, iscritti e cancellati. L’anno in corso può non essere ancora pubblicato.",
        )}
        icon={Users}
      />
      <PanelState
        state={state}
        title={t("Demografia mensile")}
        loadingLabel={t("Caricamento bilancio demografico…")}
        emptyMessage={t("Nessuna riga D7B per questo comune.")}
      >
        {(data) => {
          const nati = data.mesi.reduce((s, m) => s + (m.nati ?? 0), 0);
          const morti = data.mesi.reduce((s, m) => s + (m.morti ?? 0), 0);
          return (
            <>
              <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                <KpiCard
                  label={t("Anno")}
                  value={data.anno != null ? String(data.anno) : "—"}
                  variant="info"
                />
                <KpiCard label={t("Nati")} value={formatInteger(nati)} />
                <KpiCard label={t("Morti")} value={formatInteger(morti)} />
                <KpiCard
                  label={t("Saldo naturale")}
                  value={formatInteger(nati - morti)}
                />
              </div>
              {data.mesi.length > 1 ? (
                <div className="mb-4 panel">
                  <h3>{t("Andamento mensile")}</h3>
                  <LineChart
                    labels={data.mesi.map((m) => MESI[(m.mese || 1) - 1] ?? String(m.mese))}
                    datasets={[
                      {
                        label: t("Nati"),
                        data: data.mesi.map((m) => m.nati ?? 0),
                        color: "#008758",
                      },
                      {
                        label: t("Morti"),
                        data: data.mesi.map((m) => m.morti ?? 0),
                        color: "#D9364F",
                      },
                    ]}
                  />
                </div>
              ) : null}
            </>
          );
        }}
      </PanelState>
    </section>
  );
}
