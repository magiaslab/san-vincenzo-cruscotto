"use client";

import { Recycle } from "lucide-react";
import dynamic from "next/dynamic";
import { isFeatureEnabled } from "@/lib/comune-config";
import {
  ARRR_DATI_COMUNALI_URL,
  ISPRA_RIFIUTI_URL,
  type FrazioniRifiuti,
  type RifiutiData,
} from "@/lib/ispra-rifiuti";
import { useOpenData } from "@/lib/use-open-data";
import { useT } from "@/lib/i18n";
import {
  formatDecimal,
  formatInteger,
  formatPercent,
} from "@/lib/format";
import {
  KpiCard,
  LoadingBlock,
  OutlineLink,
  PanelHeading,
  valueOrMissing,
} from "@/components/ui";
import { PanelState } from "@/components/panel-state";

const LineChart = dynamic(
  () => import("@/components/Charts").then((m) => m.LineChart),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento grafico…" />,
  },
);

const FRAZIONI: Array<{ key: keyof FrazioniRifiuti; label: string }> = [
  { key: "umida_t", label: "Organico" },
  { key: "verde_t", label: "Verde" },
  { key: "carta_t", label: "Carta" },
  { key: "vetro_t", label: "Vetro" },
  { key: "plastica_t", label: "Plastica" },
  { key: "legno_t", label: "Legno" },
  { key: "metallo_t", label: "Metallo" },
  { key: "raee_t", label: "RAEE" },
  { key: "tessili_t", label: "Tessili" },
  { key: "ingombranti_recupero_t", label: "Ingombranti (recupero)" },
  { key: "indifferenziato_t", label: "Indifferenziato" },
];

export function RifiutiPanel() {
  const t = useT();
  const state = useOpenData<RifiutiData>("/api/rifiuti");

  if (!isFeatureEnabled("rifiuti_ispra")) return null;

  return (
    <section id="rifiuti-ispra" className="mb-4">
      <PanelHeading
        title={t("Rifiuti urbani (ISPRA)")}
        description={t(
          "Produzione e raccolta differenziata dal Catasto nazionale ISPRA, per codice ISTAT. Il gestore (SEI o analogo) non pubblica un catalogo open data: usiamo il CSV ufficiale e, se configurato, le RD% della sua pagina comunale.",
        )}
        icon={Recycle}
      />
      <PanelState
        state={state}
        title={t("Rifiuti urbani")}
        loadingLabel={t("Caricamento rifiuti ISPRA…")}
        emptyMessage={t("Nessun dato ISPRA per questo comune.")}
      >
        {(data) => <RifiutiBody data={data} fonte={state.fonte} />}
      </PanelState>
    </section>
  );
}

function RifiutiBody({
  data,
  fonte,
}: {
  data: RifiutiData;
  fonte: string | null;
}) {
  const t = useT();
  const u = data.ultimo;
  const seiCert = (data.sei?.serie ?? []).filter((s) => s.certificato);
  const seiProv = (data.sei?.serie ?? []).filter((s) => !s.certificato);
  const latestProv = seiProv.at(-1);

  return (
    <>
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("RD ISPRA")}
          value={valueOrMissing(u.rd_pct, (v) => formatPercent(v, 2))}
          hint={`${t("Anno")} ${u.anno}`}
          icon={Recycle}
          variant="success"
        />
        <KpiCard
          label={t("Rifiuti pro capite")}
          value={valueOrMissing(u.kg_ab, (v) => `${formatInteger(v)} kg/ab`)}
          hint={
            u.ru_t != null
              ? `${formatDecimal(u.ru_t, 1)} t ${t("totali")}`
              : undefined
          }
          icon={Recycle}
        />
        <KpiCard
          label={t("Raccolta differenziata (t)")}
          value={valueOrMissing(u.rd_t, (v) => formatDecimal(v, 1))}
          hint={
            u.popolazione
              ? `${formatInteger(u.popolazione)} ${t("abitanti")}`
              : undefined
          }
        />
        {latestProv ? (
          <KpiCard
            label={t("RD gestore (provvisoria)")}
            value={formatPercent(latestProv.rd_pct, 1)}
            hint={`${latestProv.anno} — ${latestProv.nota || t("Non certificata ARRR")}`}
            variant="warning"
          />
        ) : null}
      </div>

      {data.serie.length > 1 ? (
        <div className="mb-4 panel">
          <h3>{t("Serie ISPRA")}</h3>
          <LineChart
            labels={data.serie.map((r) => String(r.anno))}
            datasets={[
              {
                label: "% RD",
                data: data.serie.map((r) => r.rd_pct ?? 0),
                color: "#008758",
              },
              {
                label: "kg/ab",
                data: data.serie.map((r) => r.kg_ab ?? 0),
                color: "#CC7A00",
              },
            ]}
          />
        </div>
      ) : null}

      <div className="mb-4 overflow-x-auto panel">
        <h3>{t("Frazioni (tonnellate)")}</h3>
        <table className="min-w-full text-left text-xs sm:text-sm">
          <caption className="sr-only">{t("Frazioni rifiuti ISPRA")}</caption>
          <thead className="bg-[#e8f2fc] text-[#17324d]">
            <tr>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                {t("Frazione")}
              </th>
              <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">
                t
              </th>
            </tr>
          </thead>
          <tbody>
            {FRAZIONI.map(({ key, label }) => {
              const v = u.frazioni[key];
              if (v == null) return null;
              return (
                <tr key={key} className="border-t border-[#eef2f5]">
                  <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                    {t(label)}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {formatDecimal(v, 1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.sei && (data.sei.serie.length > 0 || data.sei.url) ? (
        <div className="mb-4 panel">
          <h3>
            {data.sei.gestore
              ? t("Gestore rifiuti: {nome}", { nome: data.sei.gestore })
              : t("Gestore rifiuti")}
          </h3>
          <p className="mt-0 text-sm text-[var(--pa-muted)]">
            {t(
              "SEI Toscana (e gli altri gestori ATO) non espongono API o CSV. La pagina comunale riporta RD% certificate ARRR e, in corso d’anno, stime provvisorie. Calendario e isole ecologiche restano pagine HTML.",
            )}
          </p>
          {seiCert.length + seiProv.length > 0 ? (
            <ul className="mt-2 list-none space-y-1 p-0 text-sm">
              {data.sei.serie.map((s) => (
                <li key={s.anno}>
                  <strong>{s.anno}</strong>: {formatPercent(s.rd_pct, 2)}
                  {s.nota ? ` — ${s.nota}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {data.sei.url ? (
              <OutlineLink href={data.sei.url}>{t("Pagina comunale gestore")}</OutlineLink>
            ) : null}
            {data.sei.calendario_url ? (
              <OutlineLink href={data.sei.calendario_url}>
                {t("Calendario raccolta")}
              </OutlineLink>
            ) : null}
            {data.sei.centro_url ? (
              <OutlineLink href={data.sei.centro_url}>
                {t("Centro di raccolta")}
              </OutlineLink>
            ) : data.sei.centri_url ? (
              <OutlineLink href={data.sei.centri_url}>
                {t("Centri di raccolta")}
              </OutlineLink>
            ) : null}
            <OutlineLink href={ARRR_DATI_COMUNALI_URL}>
              {t("Dati ARRR (XLS)")}
            </OutlineLink>
          </div>
        </div>
      ) : null}

      <p className="mb-0 text-xs text-[var(--pa-muted)] sm:text-sm">
        {t("Fonte:")} {fonte ?? ISPRA_RIFIUTI_URL} · {t("Anno")} {u.anno}.{" "}
        <a href={ISPRA_RIFIUTI_URL} target="_blank" rel="noopener noreferrer">
          {t("Download CSV ISPRA")}
        </a>
      </p>
    </>
  );
}
