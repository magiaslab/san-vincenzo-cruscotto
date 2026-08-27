"use client";

import { Landmark, Scale } from "lucide-react";
import { isFeatureEnabled } from "@/lib/comune-config";
import { DVNS_SITE_URL, type DvnsFinanzaData } from "@/lib/dvns";
import { useOpenData } from "@/lib/use-open-data";
import { useT } from "@/lib/i18n";
import {
  formatEuro,
  formatEuroCompact,
  formatInteger,
  formatPercent,
} from "@/lib/format";
import {
  KpiCard,
  OutlineLink,
  PanelHeading,
  valueOrMissing,
} from "@/components/ui";
import { PanelState } from "@/components/panel-state";

const MESI = [
  "",
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

export function DvnsFinanzaPanel() {
  const t = useT();
  const state = useOpenData<DvnsFinanzaData>("/api/finanza/dvns");

  if (!isFeatureEnabled("finanza_dvns")) return null;

  return (
    <section id="finanza-dvns" className="mt-4">
      <PanelHeading
        title={t("Redditi MEF e fabbisogni standard")}
        description={t(
          "Dati comunali da DoveVannoINostriSoldi (MCP): IRPEF 2024 e OpenCivitas. Non sostituiscono il SIOPE AgID e non si sommano tra loro.",
        )}
        icon={Landmark}
      />
      <PanelState
        state={state}
        title={t("Finanza DVNS")}
        loadingLabel={t("Caricamento IRPEF e fabbisogni…")}
        emptyMessage={t("Nessun dato DVNS per questo comune.")}
      >
        {(data) => <DvnsBody data={data} />}
      </PanelState>
    </section>
  );
}

function DvnsBody({ data }: { data: DvnsFinanzaData }) {
  const t = useT();
  const irpef = data.irpef;
  const oc = data.opencivitas;
  const reg = data.siope_regione;
  const mese =
    reg?.fino_a_mese != null && reg.fino_a_mese >= 1 && reg.fino_a_mese <= 12
      ? MESI[reg.fino_a_mese]
      : null;

  return (
    <>
      {irpef ? (
        <div className="mb-4">
          <h3 className="m-0 mb-3 text-base font-bold text-[var(--pa-ink)]">
            {t("IRPEF dichiarata")} · {irpef.anno_imposta}
          </h3>
          <div className="mb-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            <KpiCard
              label={t("Contribuenti")}
              value={valueOrMissing(irpef.contribuenti, formatInteger)}
            />
            <KpiCard
              label={t("Reddito complessivo")}
              value={valueOrMissing(
                irpef.reddito_complessivo?.euro,
                formatEuroCompact,
              )}
              hint={
                irpef.reddito_medio_eur != null
                  ? `${formatEuro(irpef.reddito_medio_eur)} / ${t("contribuente")}`
                  : undefined
              }
            />
            <KpiCard
              label={t("Imposta netta dichiarata")}
              value={valueOrMissing(
                irpef.imposta_netta_dichiarata?.euro,
                formatEuroCompact,
              )}
              hint={t("Non è gettito di cassa")}
              variant="info"
            />
            <KpiCard
              label={t("Addizionale comunale")}
              value={valueOrMissing(
                irpef.addizionale_comunale?.euro,
                formatEuroCompact,
              )}
              hint={
                irpef.addizionale_regionale?.euro != null
                  ? `${t("Regionale")} ${formatEuroCompact(irpef.addizionale_regionale.euro)}`
                  : undefined
              }
            />
          </div>
        </div>
      ) : null}

      {oc ? (
        <div className="mb-4 panel">
          <h3 className="m-0 mb-2 flex items-center gap-2 text-base font-bold text-[var(--pa-ink)]">
            <Scale size={18} aria-hidden className="text-[var(--pa-primary)]" />
            {t("Fabbisogni OpenCivitas")} · {oc.anno}
          </h3>
          <p className="mt-0 text-sm text-[var(--pa-warning)]">{oc.caveat}</p>
          <div className="mb-0 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            <KpiCard
              label={t("Spesa storica")}
              value={valueOrMissing(oc.spesa_storica_eur, formatEuroCompact)}
              hint={
                oc.spesa_storica_ab_eur != null
                  ? `${formatEuro(oc.spesa_storica_ab_eur)} /ab.`
                  : undefined
              }
            />
            <KpiCard
              label={t("Spesa standard")}
              value={valueOrMissing(oc.spesa_standard_eur, formatEuroCompact)}
              hint={
                oc.spesa_standard_ab_eur != null
                  ? `${formatEuro(oc.spesa_standard_ab_eur)} /ab.`
                  : undefined
              }
            />
            <KpiCard
              label={t("Scostamento")}
              value={valueOrMissing(oc.differenza_pct, (v) =>
                `${v > 0 ? "+" : ""}${formatPercent(v, 1)}`,
              )}
              hint={
                oc.differenza_eur != null
                  ? formatEuroCompact(oc.differenza_eur)
                  : undefined
              }
              variant={
                oc.differenza_eur != null && oc.differenza_eur > 0
                  ? "warning"
                  : "success"
              }
            />
            <KpiCard
              label={t("Livelli (1–10)")}
              value={
                oc.livello_spesa != null || oc.livello_servizi != null
                  ? `${t("Spesa")} ${oc.livello_spesa ?? "—"} · ${t("Servizi")} ${oc.livello_servizi ?? "—"}`
                  : "n.d."
              }
              icon={Scale}
            />
          </div>
        </div>
      ) : null}

      {reg ? (
        <p className="mb-3 text-sm text-[var(--pa-muted)]">
          {t("Contesto regionale SIOPE (pagamenti dei Comuni)")}: {reg.regione}
          {reg.per_abitante_eur != null
            ? ` · ${formatEuro(reg.per_abitante_eur)} /ab.`
            : ""}
          {reg.anno != null
            ? ` · ${reg.anno}${mese ? ` (${t("fino a")} ${mese})` : ""}`
            : ""}
          . {t("Il dato del comune resta il SIOPE AgID qui sopra, non la classifica DVNS.")}
        </p>
      ) : null}

      <div className="mb-2 flex flex-wrap gap-2">
        <OutlineLink href={DVNS_SITE_URL}>
          {t("Portale DoveVannoINostriSoldi")}
        </OutlineLink>
        <OutlineLink href={`${DVNS_SITE_URL.replace(/\/$/, "")}/fonti`}>
          {t("Fonti DVNS")}
        </OutlineLink>
      </div>
    </>
  );
}
