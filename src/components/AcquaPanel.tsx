"use client";

import { Droplets } from "lucide-react";
import dynamic from "next/dynamic";
import { isFeatureEnabled } from "@/lib/comune-config";
import type { AcquaData } from "@/lib/asa-acqua";
import { useOpenData } from "@/lib/use-open-data";
import { useT } from "@/lib/i18n";
import { formatInteger } from "@/lib/format";
import {
  KpiCard,
  LoadingBlock,
  OutlineLink,
  PanelHeading,
} from "@/components/ui";
import { PanelState } from "@/components/panel-state";

const AcquaMap = dynamic(
  () => import("@/components/AcquaMap").then((m) => m.AcquaMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento mappa acqua…" />,
  },
);

export function AcquaPanel() {
  const t = useT();
  const state = useOpenData<AcquaData>("/api/acqua");

  if (!isFeatureEnabled("acqua_sii")) return null;

  return (
    <section id="servizio-idrico" className="mb-4">
      <PanelHeading
        title={t("Acqua potabile")}
        description={t(
          "ASA (e gli altri gestori SII) non hanno un portale open data. Usiamo il WFS pubblico della mappa etichette/fontanelle, più i link ad AIT per qualità tecnica (RQTII) a scala di gestore, non di comune.",
        )}
        icon={Droplets}
      />
      <PanelState
        state={state}
        title={t("Servizio idrico")}
        loadingLabel={t("Caricamento dati idrici…")}
        emptyMessage={t("Nessun dato idrico configurato per questo comune.")}
      >
        {(data) => <AcquaBody data={data} />}
      </PanelState>
    </section>
  );
}

function AcquaBody({ data }: { data: AcquaData }) {
  const t = useT();
  const g = data.gestore;
  const hasMap =
    data.geojson.features.length > 0 &&
    (data.etichette.length > 0 || data.fontanelle.length > 0);

  return (
    <>
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Gestore SII")}
          value={g.nome || t("n.d.")}
        />
        <KpiCard
          label={t("Etichette potabilità")}
          value={formatInteger(data.etichette.length)}
          hint={t("Zone acquedotto")}
          icon={Droplets}
          variant="info"
        />
        <KpiCard
          label={t("Fontanelle")}
          value={formatInteger(data.fontanelle.length)}
          hint={
            data.fontanelle.some((f) => f.alta_qualita)
              ? t("Incluse alta qualità")
              : undefined
          }
        />
      </div>

      {hasMap ? (
        <div className="mb-4 overflow-hidden rounded-lg border border-[var(--pa-border)]">
          <AcquaMap geojson={data.geojson} />
        </div>
      ) : null}

      {data.etichette.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel">
          <h3>{t("Etichette analitiche")}</h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">{t("Etichette acqua potabile")}</caption>
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {t("Codice")}
                </th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {t("Acquedotto")}
                </th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {t("Prelievo")}
                </th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {t("Note")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.etichette.map((e) => (
                <tr key={e.id} className="border-t border-[#eef2f5]">
                  <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                    {e.cod_acq || e.id}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.acquedotto}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {[e.produttore, e.luogo_prel].filter(Boolean).join(" — ")}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data.fontanelle.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel">
          <h3>{t("Fontanelle pubbliche")}</h3>
          <ul className="mt-0 list-none space-y-1 p-0 text-sm">
            {data.fontanelle.map((f) => (
              <li key={f.id}>
                <strong>{f.strada || f.tipo}</strong>
                {f.ubicazione ? ` — ${f.ubicazione}` : ""}
                {f.alta_qualita ? ` (${t("Alta qualità")})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        {g.etichette_map_url ? (
          <OutlineLink href={g.etichette_map_url}>
            {t("Mappa etichette gestore")}
          </OutlineLink>
        ) : null}
        {g.fontanelle_map_url ? (
          <OutlineLink href={g.fontanelle_map_url}>
            {t("Mappa fontanelle")}
          </OutlineLink>
        ) : null}
        {g.composizione_url ? (
          <OutlineLink href={g.composizione_url}>
            {t("Composizione analitica")}
          </OutlineLink>
        ) : null}
        {g.url ? (
          <OutlineLink href={g.url}>{g.nome || t("Sito gestore")}</OutlineLink>
        ) : null}
        {g.ait_opendata_url ? (
          <OutlineLink href={g.ait_opendata_url}>
            {t("Open data AIT (RQTII)")}
          </OutlineLink>
        ) : null}
      </div>
      <p className="mb-0 text-xs text-[var(--pa-muted)] sm:text-sm">
        {t(
          "Le analisi di laboratorio restano sui PDF del gestore (mappa etichette). AIT pubblica CSV di qualità tecnica e contrattuale a scala di gestore; il sito AIT può bloccare i download automatici (WAF).",
        )}
      </p>
    </>
  );
}
