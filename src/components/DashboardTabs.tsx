"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  CloudSun,
  Factory,
  Globe2,
  Landmark,
  Map,
  Mountain,
  Palmtree,
  Stethoscope,
  Train,
  Waves,
  Users,
  TrendingUp,
  GraduationCap,
  Euro,
  Recycle,
  Droplets,
  Wind,
  Thermometer,
  Umbrella,
  CloudRain,
  Car,
  Building2,
  Briefcase,
  Heart,
  Ship,
  LandPlot,
  Fuel,
  Pill,
  School,
  Handshake,
  Gauge,
  Eye,
  Sunrise,
  Leaf,
  Accessibility,
  Zap,
  MessageSquarePlus,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/AppShell";
import { EventiComunePanel } from "@/components/EventiComunePanel";
import { FarmacieTurno } from "@/components/FarmacieTurno";
import { Footer } from "@/components/Footer";
import { ScuoleMiurPanel } from "@/components/ScuoleMiurPanel";
import { AllerteMeteoPanel } from "@/components/AllerteMeteoPanel";
import { TrasportiPanel } from "@/components/TrasportiPanel";
import { PartecipaPanel } from "@/components/PartecipaPanel";
import { TurismoFlussiPanel } from "@/components/TurismoFlussiPanel";
import { RischioPanel } from "@/components/RischioPanel";
import { OmiPanel } from "@/components/OmiPanel";
import {
  DataUnavailable,
  KpiCard,
  LoadingBlock,
  SectionIntro,
  SolidButton,
  valueOrMissing,
} from "@/components/ui";
import { COMUNI_LOOKUP } from "@/lib/constants";
import {
  formatDecimal,
  formatEuro,
  formatEuroCompact,
  formatInteger,
  formatPercent,
} from "@/lib/format";
import { scrollToTopSmooth } from "@/lib/motion";
import { useT } from "@/lib/i18n";
import { getFormatLocale } from "@/lib/i18n/locale-store";
import { translate } from "@/lib/i18n/translate";

const BarChart = dynamic(
  () => import("@/components/Charts").then((m) => m.BarChart),
  { ssr: false, loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} /> },
);
const DoughnutChart = dynamic(
  () => import("@/components/Charts").then((m) => m.DoughnutChart),
  { ssr: false, loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} /> },
);
const LineChart = dynamic(
  () => import("@/components/Charts").then((m) => m.LineChart),
  { ssr: false, loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento grafico…")} /> },
);

const MapPanel = dynamic(() => import("@/components/MapPanel"), {
  ssr: false,
  loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento mappa…")} />,
});

const Terrain3D = dynamic(() => import("@/components/Terrain3D"), {
  ssr: false,
  loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento rilievo 3D…")} />,
});

const MeteoRadarMap = dynamic(() => import("@/components/MeteoRadarMap"), {
  ssr: false,
  loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento radar…")} />,
});

const VesselFinderEmbed = dynamic(
  () =>
    import("@/components/PortoExtras").then((m) => m.VesselFinderEmbed),
  {
    ssr: false,
    loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento mappa AIS…")} />,
  },
);

const PortoWebcams = dynamic(
  () => import("@/components/PortoExtras").then((m) => m.PortoWebcams),
  {
    ssr: false,
    loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento webcam…")} />,
  },
);

const PunIdrMap = dynamic(
  () => import("@/components/InfraExtras").then((m) => m.PunIdrMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento mappa colonnine…")} />,
  },
);

const EvPrezziPanel = dynamic(() => import("@/components/EvPrezziPanel"), {
  ssr: false,
  loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento colonnine…")} />,
});

const CarburantiMap = dynamic(
  () => import("@/components/InfraExtras").then((m) => m.CarburantiMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento mappa carburanti…")} />,
  },
);

const BandaUltralargaPanel = dynamic(
  () => import("@/components/InfraExtras").then((m) => m.BandaUltralargaPanel),
  {
    ssr: false,
    loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento copertura FTTH…")} />,
  },
);

const AssistenteFab = dynamic(
  () => import("@/components/AssistenteFab").then((m) => m.AssistenteFab),
  { ssr: false },
);

const FarmacieMap = dynamic(
  () => import("@/components/FarmacieMap").then((m) => m.FarmacieMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento mappa farmacie…")} />,
  },
);

const DaeMap = dynamic(
  () => import("@/components/DaeMap").then((m) => m.DaeMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label={translate(getFormatLocale(), "Caricamento mappa DAE…")} />,
  },
);

const DisabilitaPanel = dynamic(() => import("@/components/DisabilitaPanel"), {
  ssr: false,
  loading: () => (
    <LoadingBlock label={translate(getFormatLocale(), "Caricamento accessibilità…")} />
  ),
});

type Kpi = Record<string, unknown>;

type TabId =
  | "panoramica"
  | "turismo"
  | "porto"
  | "economia"
  | "istruzione"
  | "societa"
  | "disabilita"
  | "finanza"
  | "territorio"
  | "ambiente"
  | "infra"
  | "sanita"
  | "meteo"
  | "mappa"
  | "partecipa";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "In evidenza",
    items: [
      { id: "panoramica", label: "Panoramica", Icon: Globe2 },
      { id: "sanita", label: "Sanità", Icon: Stethoscope },
      { id: "disabilita", label: "Disabilità", Icon: Accessibility },
      { id: "infra", label: "Mobilità", Icon: Train },
      { id: "meteo", label: "Meteo", Icon: CloudSun },
      { id: "partecipa", label: "Partecipa", Icon: MessageSquarePlus },
    ],
  },
  {
    label: "Territorio e mare",
    items: [
      { id: "turismo", label: "Turismo", Icon: Palmtree },
      { id: "porto", label: "Porto", Icon: Ship },
      { id: "ambiente", label: "Ambiente", Icon: Waves },
      { id: "territorio", label: "Territorio", Icon: Mountain },
      { id: "mappa", label: "Mappa", Icon: Map },
    ],
  },
  {
    label: "Economia e società",
    items: [
      { id: "economia", label: "Economia", Icon: Factory },
      { id: "istruzione", label: "Istruzione", Icon: School },
      { id: "societa", label: "Società", Icon: Handshake },
      { id: "finanza", label: "Finanza", Icon: Landmark },
    ],
  },
];

const TABS = NAV_GROUPS.flatMap((g) => [...g.items]);

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

function isTabId(v: string): v is TabId {
  return TAB_IDS.has(v);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

async function fetchDettaglio(sezioni: string) {
  const res = await fetch(`/api/dettaglio?sezioni=${encodeURIComponent(sezioni)}`);
  if (!res.ok) throw new Error("Errore dettaglio");
  return res.json();
}

function useDettaglio(sezioni: string) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDettaglio(sezioni)
      .then((d) => {
        if (!cancelled) {
          setDetail(d);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare i dati di dettaglio");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sezioni]);

  return { detail, error, loading };
}

export function DashboardTabs({
  kpi,
  generatedAt,
}: {
  kpi: Kpi;
  generatedAt?: string | null;
}) {
  const t = useT();
  const [tab, setTab] = useState<TabId>("panoramica");

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    if (fromHash && isTabId(fromHash)) setTab(fromHash);
    const onHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id && isTabId(id)) setTab(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(id: TabId) {
    setTab(id);
    if (typeof window !== "undefined") {
      const next = `#${id}`;
      if (window.location.hash !== next) {
        window.history.replaceState(null, "", next);
      }
    }
    scrollToTopSmooth();
  }

  return (
    <AppShell
      groups={NAV_GROUPS}
      activeId={tab}
      onNavigate={(id) => {
        if (isTabId(id)) navigate(id);
      }}
      generatedAt={generatedAt}
      footer={<Footer />}
    >
      <div aria-label={t(tabLabel(tab))}>
        {tab === "panoramica" && (
          <Panoramica kpi={kpi} onNavigate={navigate} />
        )}
        {tab === "turismo" && <Turismo onNavigate={navigate} />}
        {tab === "porto" && <Porto />}
        {tab === "economia" && <Economia kpi={kpi} />}
        {tab === "istruzione" && <Istruzione kpi={kpi} />}
        {tab === "societa" && <Societa kpi={kpi} />}
        {tab === "disabilita" && <DisabilitaTab />}
        {tab === "finanza" && <Finanza kpi={kpi} />}
        {tab === "territorio" && <Territorio kpi={kpi} />}
        {tab === "ambiente" && <Ambiente kpi={kpi} />}
        {tab === "infra" && <Infra kpi={kpi} />}
        {tab === "sanita" && <Sanita kpi={kpi} />}
        {tab === "meteo" && <Meteo kpi={kpi} />}
        {tab === "mappa" && <MapPanel kpi={kpi} />}
        {tab === "partecipa" && <PartecipaPanel />}
      </div>
      <AssistenteFab />
    </AppShell>
  );
}

function tabLabel(id: TabId): string {
  return TABS.find((t) => t.id === id)?.label ?? id;
}

function Panoramica({
  kpi,
  onNavigate,
}: {
  kpi: Kpi;
  onNavigate: (id: TabId) => void;
}) {
  const t = useT();
  const go = (id: TabId) => ({
    detailLabel: tabLabel(id),
    onDetail: () => onNavigate(id),
  });
  const demo = asRecord(kpi.demografia);
  const turismo = asRecord(kpi.turismo);
  const lavoro = asRecord(kpi.lavoro_profilo);
  const istruzione = asRecord(kpi.istruzione_profilo);
  const redditi = asRecord(kpi.redditi_mef);
  const ambiente = asRecord(kpi.ambiente);
  const banda = asRecord(kpi.banda_larga_agcom);
  const pnrr = asRecord(kpi.pnrr);
  const siope = asRecord(kpi.siope);
  const imprese = asRecord(kpi.imprese_asia);
  const ev = asRecord(kpi.ricarica_ev_pun);
  const veicoli = asRecord(kpi.veicoli_aci);
  const runts = asRecord(kpi.terzo_settore_runts);
  const civici = asRecord(kpi.civici_anncsu);
  const patrimonio = asRecord(kpi.patrimonio_pa);
  const anac = asRecord(kpi.contratti_anac);
  const opere = asRecord(kpi.opere_bdap);
  const carburanti = asRecord(kpi.carburanti_mimit);
  const sanita = asRecord(kpi.sanita_mds);
  const pendol = asRecord(kpi.pendolarismo);
  const morfo = asRecord(kpi.morfologia_cnr);
  const anagrafica = asRecord(kpi.anagrafica);

  return (
    <section>
      <SectionIntro
        title={t("Cosa ti serve oggi?")}
        description={`${t("Dati aperti di")} ${String(anagrafica?.nome ?? "San Vincenzo")}: ${t("parti dai servizi utili, poi esplora le sezioni dedicate.")}`}
      />

      <div className="mb-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            {
              id: "sanita" as const,
              title: t("Farmacie di turno"),
              hint: t("Orari e punti più vicini"),
              Icon: Pill,
            },
            {
              id: "disabilita" as const,
              title: t("Accessibilità e disabilità"),
              hint: t("Luoghi accessibili, stalli e bagni OSM"),
              Icon: Accessibility,
            },
            {
              id: "infra" as const,
              title: t("Prezzi carburanti"),
              hint: `Benzina self media ${formatDecimal(num(carburanti?.prezzo_medio_benzina_self), 3)} €/L`,
              Icon: Fuel,
            },
            {
              id: "infra" as const,
              title: t("Trasporti e mobilità"),
              hint: t("Bus, treni GTFS, ciclabili e colonnine EV"),
              Icon: Train,
            },
            {
              id: "meteo" as const,
              title: t("Meteo e allerte"),
              hint: t("OpenWeather, previsioni e Protezione Civile"),
              Icon: CloudSun,
            },
            {
              id: "ambiente" as const,
              title: t("Mare e balneazione"),
              hint: t("Qualità acque ARPAT"),
              Icon: Waves,
            },
            {
              id: "istruzione" as const,
              title: t("Scuole e istruzione"),
              hint: t("Plessi MIUR e titoli di studio"),
              Icon: School,
            },
            {
              id: "porto" as const,
              title: t("Porto"),
              hint: t("Posti barca, webcam e AIS"),
              Icon: Ship,
            },
            {
              id: "turismo" as const,
              title: t("Eventi e biblioteca"),
              hint: t("Calendario Visit SV e Biblioteca Calandra"),
              Icon: Palmtree,
            },
            {
              id: "partecipa" as const,
              title: t("Suggerimenti"),
              hint: t("Proponi miglioramenti: diventano issue su GitHub"),
              Icon: MessageSquarePlus,
            },
          ] as const
        ).map(({ id, title, hint, Icon }, i) => (
          <button
            key={`${id}-${title}-${i}`}
            type="button"
            onClick={() => onNavigate(id)}
            className="panel min-h-11 text-left transition hover:border-[var(--pa-primary)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="m-0 text-sm font-bold text-[var(--pa-ink)]">{title}</p>
              <Icon
                size={20}
                className="shrink-0 text-[var(--pa-primary)]"
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <p className="m-0 mt-1 text-xs text-[var(--pa-muted)]">{hint}</p>
          </button>
        ))}
      </div>

      <h3 className="mb-2 mt-0 text-sm font-bold text-[var(--pa-ink)]">
        {t("Instantanea del comune")}
      </h3>
      <div className="mb-4 grid gap-2.5 sm:mb-5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        <KpiCard
          label={t("Popolazione")}
          value={valueOrMissing(demo?.popolazione, formatInteger)}
          hint={String(demo?.riferimento ?? "")}
          icon={Users}
          variant="info"
          {...go("societa")}
        />
        <KpiCard
          label={t("Reddito medio")}
          value={valueOrMissing(redditi?.reddito_medio_eur, formatEuro)}
          hint={`${formatInteger(num(redditi?.n_contribuenti))} contribuenti`}
          icon={Euro}
          variant="success"
          {...go("economia")}
        />
        <KpiCard
          label={t("Indice turisticità")}
          value={valueOrMissing(turismo?.indice_turisticita_per_100ab, (v) => `${formatDecimal(v, 1)} /100 ab.`)}
          hint={`${formatInteger(num(turismo?.totale_strutture))} strutture`}
          icon={Palmtree}
          variant="success"
          {...go("turismo")}
        />
        <KpiCard
          label={t("Raccolta differenziata")}
          value={valueOrMissing(ambiente?.raccolta_differenziata_pct, formatPercent)}
          icon={Recycle}
          variant="success"
          {...go("ambiente")}
        />
        <KpiCard
          label={t("Copertura FTTH")}
          value={valueOrMissing(banda?.copertura_ftth_pct, formatPercent)}
          {...go("infra")}
        />
        <KpiCard
          label={t("Farmacie")}
          value={valueOrMissing(sanita?.n_farmacie, formatInteger)}
          hint={`${formatInteger(num(sanita?.n_parafarmacie))} parafarmacie`}
          icon={Heart}
          variant="info"
          {...go("sanita")}
        />
        <KpiCard
          label={t("Punti ricarica EV")}
          value={valueOrMissing(ev?.n_totale, formatInteger)}
          hint={`${formatPercent(num(ev?.pct_attivi))} attivi · ${t("prezzi in Mobilità")}`}
          icon={Zap}
          {...go("infra")}
        />
        <KpiCard
          label={t("Accessibilità OSM")}
          value={t("Mappa e stalli")}
          hint={t("Disabilità e luoghi accessibili")}
          icon={Accessibility}
          variant="info"
          {...go("disabilita")}
        />
        <KpiCard
          label={t("Enti RUNTS")}
          value={valueOrMissing(runts?.n_enti_totali, formatInteger)}
          hint={t("Terzo settore e inclusione")}
          icon={Handshake}
          {...go("societa")}
        />
      </div>

      <details className="panel">
        <summary className="cursor-pointer text-sm font-bold text-[var(--pa-ink)]">{t("Altri indicatori (collegamenti alle sezioni)")}</summary>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            label={t("Età media")}
            value={valueOrMissing(demo?.eta_media, (v) => formatDecimal(v, 1))}
            icon={Users}
            {...go("societa")}
          />
          <KpiCard
            label={t("Indice di vecchiaia")}
            value={valueOrMissing(demo?.indice_vecchiaia, (v) => formatDecimal(v, 1))}
            icon={TrendingUp}
            {...go("societa")}
          />
          <KpiCard
            label={t("Tasso occupazione")}
            value={valueOrMissing(lavoro?.tasso_occupazione, formatPercent)}
            icon={Briefcase}
            variant="success"
            {...go("economia")}
          />
          <KpiCard
            label={t("Diploma o oltre")}
            value={valueOrMissing(istruzione?.pct_diploma_oltre, formatPercent)}
            icon={GraduationCap}
            {...go("istruzione")}
          />
          <KpiCard
            label={t("Consumo di suolo")}
            value={valueOrMissing(ambiente?.consumo_suolo_pct, formatPercent)}
            icon={LandPlot}
            variant="warning"
            {...go("ambiente")}
          />
          <KpiCard
            label={t("Punti ricarica EV")}
            value={valueOrMissing(ev?.n_totale, formatInteger)}
            hint={`${formatPercent(num(ev?.pct_attivi))} attivi`}
            {...go("infra")}
          />
          <KpiCard
            label={t("Veicoli")}
            value={valueOrMissing(veicoli?.totale_veicoli, formatInteger)}
            icon={Car}
            {...go("infra")}
          />
          <KpiCard
            label={t("Unità locali ASIA")}
            value={valueOrMissing(imprese?.ul_totali, formatInteger)}
            icon={Building2}
            {...go("economia")}
          />
          <KpiCard
            label={t("Saldo cassa SIOPE")}
            value={valueOrMissing(siope?.saldo_cassa_eur, formatEuroCompact)}
            {...go("finanza")}
          />
          <KpiCard
            label={t("PNRR")}
            value={valueOrMissing(pnrr?.importo_assegnato_eur, formatEuroCompact)}
            {...go("finanza")}
          />
          <KpiCard
            label={t("Opere BDAP")}
            value={valueOrMissing(opere?.n_progetti, formatInteger)}
            {...go("finanza")}
          />
          <KpiCard
            label={t("Contratti ANAC")}
            value={valueOrMissing(anac?.n_aggiudicazioni, formatInteger)}
            {...go("finanza")}
          />
          <KpiCard
            label={t("Patrimonio PA")}
            value={valueOrMissing(patrimonio?.n_immobili, formatInteger)}
            icon={Building2}
            {...go("finanza")}
          />
          <KpiCard
            label={t("Enti RUNTS")}
            value={valueOrMissing(runts?.n_enti_totali, formatInteger)}
            {...go("societa")}
          />
          <KpiCard
            label={t("Civici ANNCSU")}
            value={valueOrMissing(civici?.n_civici, formatInteger)}
            {...go("mappa")}
          />
          <KpiCard
            label={t("Impianti carburanti")}
            value={valueOrMissing(carburanti?.n_impianti, formatInteger)}
            {...go("infra")}
          />
          <KpiCard
            label={t("Pendolarismo netto")}
            value={valueOrMissing(pendol?.saldo_netto, formatInteger)}
            {...go("infra")}
          />
          <KpiCard
            label={t("Elevazione media")}
            value={valueOrMissing(morfo?.elev_mean, (v) => `${formatInteger(v)} m`)}
            {...go("territorio")}
          />
        </div>
      </details>
    </section>
  );
}


function Istruzione({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading } = useDettaglio("profilo");
  const istruzioneKpi = asRecord(kpi.istruzione_profilo);
  const istruzione = asRecord(asRecord(detail?.profilo)?.istruzione) ?? istruzioneKpi;
  const dettaglioIstr = asRecord(istruzione?.dettaglio);

  return (
    <section>
      <SectionIntro
        title={t("Istruzione")}
        description={t("Titoli di studio ISTAT e plessi scolastici MIUR nel comune.")}
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Diploma o oltre")}
          value={valueOrMissing(istruzione?.pct_diploma_oltre ?? istruzioneKpi?.pct_diploma_oltre, formatPercent)}
          icon={GraduationCap}
          variant="info"
        />
        <KpiCard
          label={t("Terziario")}
          value={valueOrMissing(istruzione?.pct_terziario ?? istruzioneKpi?.pct_terziario, formatPercent)}
          icon={GraduationCap}
          variant="success"
        />
      </div>

      {loading ? <LoadingBlock /> : null}

      {dettaglioIstr ? (
        <div className="mb-4 panel">
          <h3>{t("Titolo di studio (pop. 25–64)")}</h3>
          <BarChart
            labels={["Nessun titolo", "Elementare", "Media", "Diploma", "Laurea triennale", "Laurea mag./dott."]}
            datasets={[
              {
                label: "Persone",
                data: [
                  num(dettaglioIstr.nessun_titolo) ?? 0,
                  num(dettaglioIstr.elementare) ?? 0,
                  num(dettaglioIstr.media) ?? 0,
                  num(dettaglioIstr.diploma) ?? 0,
                  num(dettaglioIstr.laurea_triennale) ?? 0,
                  num(dettaglioIstr.laurea_magistrale_dottorato) ?? 0,
                ],
              },
            ]}
          />
        </div>
      ) : null}

      <ScuoleMiurPanel />
    </section>
  );
}

function DisabilitaTab() {
  const { detail, loading } = useDettaglio("runts");
  const runts = asRecord(detail?.runts);
  const enti = Array.isArray(runts?.enti)
    ? (runts.enti as Array<{
        denom?: string;
        sez?: string;
        x1000?: boolean;
        data_iscr?: string;
        rapp?: string;
      }>)
    : [];

  return (
    <>
      {loading ? <LoadingBlock /> : null}
      <DisabilitaPanel runtsEnti={enti} />
    </>
  );
}

function Societa({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading } = useDettaglio("demografia,profilo,censimento,runts");
  const demo = asRecord(kpi.demografia);
  const runtsKpi = asRecord(kpi.terzo_settore_runts);

  const demoExt = asRecord(detail?.demografia);
  const fasce = asRecord(demoExt?.fasce_eta);
  const profilo = asRecord(detail?.profilo);
  const cens = asRecord(asRecord(detail?.censimento)?.kpi_comune);
  const distEta = asRecord(asRecord(asRecord(detail?.censimento)?.distribuzioni_comune)?.eta_5anni);
  const piramideFasce = Array.isArray(demoExt?.piramide_fasce)
    ? (demoExt.piramide_fasce as Array<{ label: string; m: number; f: number; tot: number }>)
    : [];

  const runts = asRecord(detail?.runts);
  const enti = Array.isArray(runts?.enti)
    ? (runts.enti as Array<{ denom?: string; sez?: string; x1000?: boolean; data_iscr?: string; rapp?: string }>)
    : [];
  const mix = asRecord(asRecord(runts?.kpi)?.mix_sezione);
  const iscrizioniAnno = asRecord(asRecord(runts?.kpi)?.iscrizioni_per_anno);

  return (
    <section>
      <SectionIntro
        title={t("Società")}
        description={t("Demografia, famiglie, censimento e terzo settore (RUNTS).")}
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Popolazione")}
          value={valueOrMissing(demo?.popolazione, formatInteger)}
          hint={String(demo?.riferimento ?? "")}
          icon={Users}
          variant="info"
        />
        <KpiCard
          label={t("Maschi / Femmine")}
          value={`${formatInteger(num(demo?.maschi))} / ${formatInteger(num(demo?.femmine))}`}
          icon={Users}
        />
        <KpiCard
          label={t("Età media")}
          value={valueOrMissing(demo?.eta_media, (v) => formatDecimal(v, 1))}
          icon={Users}
        />
        <KpiCard
          label={t("Indice di vecchiaia")}
          value={valueOrMissing(demo?.indice_vecchiaia, (v) => formatDecimal(v, 1))}
          icon={TrendingUp}
        />
        <KpiCard
          label={t("Indice di dipendenza")}
          value={valueOrMissing(demo?.indice_dipendenza, (v) => formatDecimal(v, 1))}
        />
        <KpiCard
          label={t("Enti RUNTS")}
          value={valueOrMissing(runtsKpi?.n_enti_totali, formatInteger)}
          hint={`${formatInteger(num(runtsKpi?.n_5x1000))} iscritti al 5x1000`}
          icon={Handshake}
          variant="success"
        />
      </div>

      {loading ? <LoadingBlock label={t("Caricamento dati società…")} /> : null}

      {fasce ? (
        <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="panel">
            <h3>{t("Fasce d&apos;età")}</h3>
            <DoughnutChart
              labels={["0–14", "15–64", "65+"]}
              values={[
                num(asRecord(fasce["0_14"])?.n) ?? 0,
                num(asRecord(fasce["15_64"])?.n) ?? 0,
                num(asRecord(fasce["65_piu"])?.n) ?? 0,
              ]}
            />
            <ul className="mt-2.5 space-y-1 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
              <li>0–14: {formatInteger(num(asRecord(fasce["0_14"])?.n))} ({formatPercent(num(asRecord(fasce["0_14"])?.pct))})</li>
              <li>15–64: {formatInteger(num(asRecord(fasce["15_64"])?.n))} ({formatPercent(num(asRecord(fasce["15_64"])?.pct))})</li>
              <li>65+: {formatInteger(num(asRecord(fasce["65_piu"])?.n))} ({formatPercent(num(asRecord(fasce["65_piu"])?.pct))})</li>
              <li>85+: {formatInteger(num(asRecord(fasce["85_piu"])?.n))} ({formatPercent(num(asRecord(fasce["85_piu"])?.pct))})</li>
            </ul>
          </div>
          {piramideFasce.length > 0 ? (
            <div className="panel">
              <h3>{t("Piramide per età (fasce quinquennali)")}</h3>
              <BarChart
                labels={piramideFasce.map((f) => f.label)}
                datasets={[
                  { label: "Maschi", data: piramideFasce.map((f) => f.m), color: "#0066CC" },
                  { label: "Femmine", data: piramideFasce.map((f) => f.f), color: "#D9364F" },
                ]}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-3">
        {cens ? (
          <div className="panel">
            <h3>{t("Censimento (sezioni)")}</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li>Sezioni: {formatInteger(num(cens.n_sezioni))}</li>
              <li>Famiglie: {formatInteger(num(cens.famiglie_totali))}</li>
              <li>
                Abitazioni: {formatInteger(num(cens.abitazioni_totali))} (
                {formatInteger(num(cens.abitazioni_occupate))} occupate,{" "}
                {formatInteger(num(cens.abitazioni_vuote))} vuote)
              </li>
              <li>Stranieri: {formatInteger(num(cens.stranieri_totali))}</li>
            </ul>
          </div>
        ) : null}
        {asRecord(profilo?.cittadinanza) || asRecord(profilo?.famiglie) ? (
          <div className="panel">
            <h3>{t("Famiglie e cittadinanza")}</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li>
                Famiglie: {formatInteger(num(asRecord(profilo?.famiglie)?.n_famiglie))} (dim. media{" "}
                {formatDecimal(num(asRecord(profilo?.famiglie)?.dim_media_famiglia), 1)})
              </li>
              <li>Italiani: {formatInteger(num(asRecord(profilo?.cittadinanza)?.italiani_n))}</li>
              <li>
                Stranieri: {formatInteger(num(asRecord(profilo?.cittadinanza)?.stranieri_n))} (
                {formatPercent(num(asRecord(profilo?.cittadinanza)?.stranieri_pct))})
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      {distEta ? (
        <div className="mb-4 panel">
          <h3>{t("Popolazione censimento per età (5 anni)")}</h3>
          <BarChart
            labels={Object.keys(distEta)}
            datasets={[{ label: "Abitanti", data: Object.values(distEta).map((v) => Number(v) || 0) }]}
          />
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {mix ? (
          <div className="panel">
            <h3>{t("Mix sezioni RUNTS")}</h3>
            <DoughnutChart labels={Object.keys(mix)} values={Object.values(mix).map((v) => Number(v) || 0)} />
          </div>
        ) : null}
        {iscrizioniAnno ? (
          <div className="panel">
            <h3>{t("Iscrizioni RUNTS per anno")}</h3>
            <BarChart
              labels={Object.keys(iscrizioniAnno)}
              datasets={[{ label: "Iscrizioni", data: Object.values(iscrizioniAnno).map((v) => Number(v) || 0) }]}
            />
          </div>
        ) : null}
      </div>

      {enti.length > 0 ? (
        <div className="overflow-x-auto panel p-0">
          <h3 className="px-3 pt-3 sm:px-4 sm:pt-4">{t("Elenco enti RUNTS")}</h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Denominazione")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Sezione")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Rappresentante")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">5x1000</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Iscrizione")}</th>
              </tr>
            </thead>
            <tbody>
              {enti.map((e) => (
                <tr key={e.denom} className="border-t border-[#eef2f5]">
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.denom}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.sez}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.rapp ?? "—"}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.x1000 ? "Sì" : "No"}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{e.data_iscr ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function Turismo({
  onNavigate,
}: {
  onNavigate: (id: TabId) => void;
}) {
  const t = useT();
  const { detail, error, loading } = useDettaglio("turismo");
  const [eventiComune, setEventiComune] = useState<Record<string, unknown> | null>(null);
  const [eventiToscana, setEventiToscana] = useState<Record<string, unknown> | null>(null);
  const [biblioteca, setBiblioteca] = useState<Record<string, unknown> | null>(null);
  const [cultura, setCultura] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/comune/eventi").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/toscana/eventi").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/comune/biblioteca").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/cultura/luoghi").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([ec, et, bib, c]) => {
        if (!cancelled) {
          setEventiComune(ec);
          setEventiToscana(et);
          setBiblioteca(bib);
          setCultura(c);
        }
      })
      .catch((err) => console.error("Errore caricamento dati turismo extra:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const turismo = asRecord(detail?.turismo);
  const capacita = asRecord(turismo?.capacita_comune);
  const alberghi = asRecord(capacita?.alberghi);
  const extra = asRecord(capacita?.extra_alberghiero);
  const flussi = asRecord(turismo?.flussi_provincia);

  const luoghiCultura = Array.isArray(cultura?.luoghi)
    ? (cultura.luoghi as Array<Record<string, unknown>>)
    : [];
  const listaEventiComune = Array.isArray(eventiComune?.eventi)
    ? (eventiComune.eventi as Array<Record<string, unknown>>)
    : [];
  const listaEventiToscana = Array.isArray(eventiToscana?.eventi)
    ? (eventiToscana.eventi as Array<Record<string, unknown>>).slice(0, 12)
    : [];
  const orariBiblio = Array.isArray(biblioteca?.orari)
    ? (biblioteca.orari as Array<{ giorno?: string; orario?: string }>)
    : [];

  const stelleLabels = ["5", "4", "3", "2", "1"];
  const stelleData = stelleLabels.map((s) => num(asRecord(alberghi?.[`stelle_${s}`])?.strutture) ?? 0);
  const stelleLetti = stelleLabels.map((s) => num(asRecord(alberghi?.[`stelle_${s}`])?.letti) ?? 0);

  return (
    <section>
      <SectionIntro
        title={t("Turismo")}
        description={t(
          "Ricettività ISTAT, flussi e stagionalità (Regione Toscana), calendario eventi comunale, biblioteca e cultura. I dati del porto sono nella sezione dedicata.",
        )}
        sourceNote={t(
          "Flussi comunali: arrivi/presenze da open data Regione Toscana (fonte ISTAT).",
        )}
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={t("Strutture")} value={valueOrMissing(capacita?.totale_strutture, formatInteger)} />
        <KpiCard label={t("Letti")} value={valueOrMissing(capacita?.totale_letti, formatInteger)} />
        <KpiCard label={t("Camere")} value={valueOrMissing(capacita?.totale_camere, formatInteger)} />
        <KpiCard label={t("Indice turisticità")} value={valueOrMissing(capacita?.indice_turisticita_per_100ab, (v) => `${formatDecimal(v, 1)} /100 ab.`)} />
        <KpiCard
          label={t("Eventi in calendario")}
          value={valueOrMissing(eventiComune?.n_eventi, formatInteger)}
          hint={t("Visit San Vincenzo")}
          icon={Palmtree}
          variant="info"
        />
      </div>

      <TurismoFlussiPanel />

      <p className="mb-4 mt-4 text-sm text-[var(--pa-muted)]">
        {t("Cerchi posti barca, webcam o traffico AIS? Vai a")}{" "}
        <button
          type="button"
          className="font-semibold text-[var(--pa-primary)] underline"
          onClick={() => onNavigate("porto")}
        >
          Porto
        </button>
        .
      </p>

      {loading ? <LoadingBlock /> : null}
      {error ? <DataUnavailable message={error} /> : null}

      {capacita ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="panel">
            <h3>{t("Alberghiero — strutture per stelle")}</h3>
            <p className="mb-2.5 text-xs text-[#5b6f82] sm:mb-3 sm:text-sm">
              {formatInteger(num(alberghi?.totale_strutture))} strutture · {formatInteger(num(alberghi?.totale_letti))} letti
              {asRecord(alberghi?.residence)?.strutture != null
                ? ` · residence ${formatInteger(num(asRecord(alberghi?.residence)?.strutture))}`
                : ""}
            </p>
            <BarChart
              labels={stelleLabels.map((s) => `${s}★`)}
              datasets={[
                { label: "Strutture", data: stelleData, color: "#0066CC" },
                { label: "Letti", data: stelleLetti, color: "#CC7A00" },
              ]}
            />
          </div>
          <div className="panel">
            <h3>{t("Extra-alberghiero")}</h3>
            <p className="mb-2.5 text-xs text-[#5b6f82] sm:mb-3 sm:text-sm">
              {formatInteger(num(extra?.totale_strutture))} strutture · {formatInteger(num(extra?.totale_letti))} letti
            </p>
            <BarChart
              labels={["Case affitto", "Agriturismi", "Camping/villaggi"]}
              datasets={[
                {
                  label: "Strutture",
                  data: [
                    num(asRecord(extra?.case_in_affitto)?.strutture) ?? 0,
                    num(asRecord(extra?.agriturismi)?.strutture) ?? 0,
                    num(asRecord(extra?.camping_villaggi)?.strutture) ?? 0,
                  ],
                },
                {
                  label: "Letti",
                  data: [
                    num(asRecord(extra?.case_in_affitto)?.letti) ?? 0,
                    num(asRecord(extra?.agriturismi)?.letti) ?? 0,
                    num(asRecord(extra?.camping_villaggi)?.letti) ?? 0,
                  ],
                  color: "#008758",
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {flussi ? (
        <div className="mt-4 panel bg-[#fff8e6]">
          <h3 className="m-0 mb-3 text-base font-bold text-[var(--pa-ink)]">
            {t("Flussi provinciali (Livorno) — anno")} {String(flussi.anno ?? "")}
          </h3>
          {flussi._warning ? <p className="text-sm text-[#5b6f82]">{String(flussi._warning)}</p> : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label={t("Arrivi totali")} value={formatInteger(num(flussi.arrivi_totali))} />
            <KpiCard label={t("Presenze totali")} value={formatInteger(num(flussi.presenze_totali))} />
            <KpiCard label={t("Permanenza media")} value={`${formatDecimal(num(flussi.permanenza_media), 1)} gg`} />
            <KpiCard label={t("Quota stranieri")} value={formatPercent(num(flussi.stranieri_pct))} />
          </div>
            <p className="mb-0 mt-2.5 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
              Arrivi IT {formatInteger(num(flussi.arrivi_italiani))} / EST {formatInteger(num(flussi.arrivi_stranieri))} ·
              Presenze IT {formatInteger(num(flussi.presenze_italiane))} / EST {formatInteger(num(flussi.presenze_straniere))}
            </p>
        </div>
      ) : null}

      {listaEventiComune.length > 0 ? (
        <EventiComunePanel
          eventi={listaEventiComune}
          nEventi={num(eventiComune?.n_eventi) ?? listaEventiComune.length}
          fonteUrl={String(asRecord(eventiComune?.fonte)?.url ?? "") || null}
          comuneUrl={
            String(asRecord(eventiComune?.fonte)?.comune_url ?? "") || null
          }
        />
      ) : eventiComune?.disponibile === false ? (
        <div className="mt-4">
          <DataUnavailable
            message={String(eventiComune?.messaggio ?? "Eventi comunali non disponibili")}
          />
        </div>
      ) : null}

      {biblioteca?.disponibile === true ? (
        <div className="mt-4 panel">
          <h3>{String(biblioteca.nome ?? "Biblioteca comunale")}</h3>
          <p className="mb-2 text-xs sm:text-sm text-[#5b6f82]">
            {String(biblioteca.descrizione ?? "")}
          </p>
          <ul className="mb-3 space-y-1 text-xs sm:text-sm">
            <li>
              <strong>{t("Indirizzo:")}</strong> {String(biblioteca.indirizzo ?? "—")}
            </li>
            <li>
              <strong>{t("Telefono:")}</strong>{" "}
              <a href={`tel:${String(biblioteca.telefono ?? "").replace(/\s/g, "")}`} className="underline">
                {String(biblioteca.telefono ?? "—")}
              </a>
            </li>
            <li>
              <strong>{t("Email:")}</strong>{" "}
              <a href={`mailto:${String(biblioteca.email ?? "")}`} className="underline">
                {String(biblioteca.email ?? "—")}
              </a>
            </li>
          </ul>
          {orariBiblio.length > 0 ? (
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {orariBiblio.map((o) => (
                <div key={String(o.giorno)} className="rounded bg-[var(--pa-surface-soft)] px-2 py-1.5 text-center text-xs">
                  <div className="font-bold text-[var(--pa-ink)]">{String(o.giorno)}</div>
                  <div className="text-[var(--pa-muted)]">{String(o.orario)}</div>
                </div>
              ))}
            </div>
          ) : null}
          <p className="mb-0 text-xs text-[#5b6f82] sm:text-sm">
            {t("Fonte:")}{" "}
            <a
              href={String(asRecord(biblioteca.fonte)?.url ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {t("Comune di San Vincenzo")}
            </a>
            {" · "}
            <a
              href={String(biblioteca.opac_url ?? "")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Catalogo OPAC
            </a>
          </p>
        </div>
      ) : null}

      {luoghiCultura.length > 0 ? (
        <div className="mt-4 panel">
          <h3 className="m-0 mb-3 text-base font-bold text-[var(--pa-ink)]">
            {t("Luoghi di interesse culturale")}
          </h3>
          <ul className="m-0 list-none space-y-3 p-0 text-xs sm:text-sm">
            {luoghiCultura.map((luogo) => {
              const nome = String(luogo.nome ?? "");
              const sito =
                typeof luogo.sito === "string" && luogo.sito.trim()
                  ? luogo.sito.trim()
                  : null;
              const maps =
                typeof luogo.maps_url === "string" && luogo.maps_url.trim()
                  ? luogo.maps_url.trim()
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${nome}, San Vincenzo LI`,
                    )}`;
              const primary = sito || maps;
              return (
                <li
                  key={nome}
                  className="border-b border-[#eef2f5] pb-3 last:border-0 last:pb-0"
                >
                  <a
                    href={primary}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[var(--pa-primary)] underline-offset-2 hover:underline sm:text-base"
                  >
                    {nome}
                  </a>
                  <br />
                  <span className="text-[#5b6f82]">
                    {String(luogo.tipologia)} • {String(luogo.tipo)}
                    {luogo.visitabile === true ? ` • ${t("Visitabile")}` : ""}
                  </span>
                  {luogo.note ? (
                    <>
                      <br />
                      <span className="text-xs text-[#5b6f82]">
                        {String(luogo.note)}
                      </span>
                    </>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3">
                    {sito ? (
                      <a
                        href={sito}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--pa-primary)] underline"
                      >
                        {t("Sito ufficiale")}
                      </a>
                    ) : null}
                    <a
                      href={maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[var(--pa-primary)] underline"
                    >
                      Google Maps
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mb-0 mt-2.5 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
            {t("Fonte: Ministero della Cultura - Catalogo generale beni culturali")}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <DataUnavailable
            message={t("Beni culturali")}
            hint={t(
              "Al momento non risultano luoghi dal Catalogo generale dei beni culturali per questo comune, oppure il dataset non ha restituito voci. Puoi proporre una fonte in Partecipa.",
            )}
          />
        </div>
      )}

      <div className="mt-4 panel bg-[#fff4e6]">
        <h3>{t("Eventi culturali Regione Toscana")}</h3>
        <p className="mb-2 text-xs sm:text-sm">
          {String(
            eventiToscana?.note ??
              eventiToscana?.messaggio ??
              "Dataset Sistema Cultura (open data regionale).",
          )}
        </p>
        {listaEventiToscana.length > 0 ? (
          <ul className="mb-3 space-y-2 text-xs sm:text-sm">
            {listaEventiToscana.map((ev, i) => (
              <li key={`${String(ev.titolo)}-${i}`} className="border-b border-[#f0e6d4] pb-2 last:border-0">
                <strong>{String(ev.titolo)}</strong>
                {ev.categoria ? (
                  <span className="ml-2 rounded bg-[#0066CC] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {String(ev.categoria)}
                  </span>
                ) : null}
                <br />
                <span className="text-[#5b6f82]">
                  {[ev.comune, ev.luogo, ev.data_inizio].filter(Boolean).map(String).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-2 text-xs text-[#5b6f82] sm:text-sm">
            Nessun evento attivo restituito dalle risorse JSON regionali al momento
            {eventiToscana?.filtro_territoriale
              ? ` (${String(eventiToscana.filtro_territoriale)})`
              : ""}
            . Usa il calendario comunale sopra.
          </p>
        )}
        {Array.isArray(eventiToscana?.categorie) ? (
          <ul className="mb-2 flex flex-wrap gap-2">
            {(eventiToscana.categorie as string[]).map((cat) => (
              <li
                key={cat}
                className="rounded bg-[#0066CC] px-2 py-1 text-xs font-semibold text-white"
              >
                {cat}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mb-0 mt-2.5 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
          {t("Fonte:")}{" "}
          <a
            href="https://dati.toscana.it/dataset/rt-eventi-sistcult"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Regione Toscana Open Data
          </a>
        </p>
      </div>
    </section>
  );
}

function Porto() {
  const t = useT();
  const [porti, setPorti] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/toscana/porti")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (!cancelled) setPorti(p);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const portualita = asRecord(porti?.portualita);
  const ormeggio = asRecord(porti?.ormeggio);
  const contesto = asRecord(porti?.contesto_regionale);
  const servizi = Array.isArray(porti?.servizi)
    ? (porti.servizi as string[])
    : [];
  const fonti = Array.isArray(porti?.fonti)
    ? (porti.fonti as Array<{ nome?: string; url?: string }>)
    : [];

  return (
    <section>
      <SectionIntro
        title={t("Porto")}
        description={t("Scheda del porto turistico: posti barca, servizi, webcam ufficiali del Comune e traffico AIS via VesselFinder.")}
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Posti barca")}
          value={valueOrMissing(
            portualita?.posti_barca ?? ormeggio?.posti_barca,
            formatInteger,
          )}
          hint={String(portualita?.tipo ?? "")}
          icon={Ship}
          variant="info"
        />
        <KpiCard
          label={t("Classificazione")}
          value={String(porti?.classificazione ?? "n.d.")}
          icon={Ship}
        />
        <KpiCard
          label={t("Posti barca in Toscana")}
          value={valueOrMissing(contesto?.totale_posti_barca, formatInteger)}
          hint={t("Contesto regionale")}
        />
        <KpiCard
          label={t("Coordinate porto")}
          value={
            portualita?.lat != null && portualita?.lon != null
              ? `${formatDecimal(num(portualita.lat), 4)}, ${formatDecimal(num(portualita.lon), 4)}`
              : "n.d."
          }
        />
      </div>

      {loading ? <LoadingBlock label={t("Caricamento dati porto…")} /> : null}

      {portualita?.descrizione ? (
        <div className="mb-4 panel">
          <h3>{t("Scheda porto")}</h3>
          <p className="mb-2 text-sm text-[#5b6f82]">
            {String(portualita.descrizione)}
          </p>
          {servizi.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {servizi.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-[#e8f2fc] px-3 py-1 text-sm font-semibold text-[#17324d]"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4">
        <PortoWebcams />
      </div>

      <div className="mb-4">
        <VesselFinderEmbed />
      </div>

      {fonti.length > 0 ? (
        <p className="text-xs text-[#5b6f82]">
          Fonti sezione:{" "}
          {fonti.map((f, i) => (
            <span key={f.url ?? f.nome}>
              {i > 0 ? " · " : null}
              {f.url ? (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {f.nome}
                </a>
              ) : (
                f.nome
              )}
            </span>
          ))}
          . Per dati AIS programmatici (JSON) VesselFinder richiede un&apos;API a
          pagamento; qui usiamo solo l&apos;embed gratuito della mappa.
        </p>
      ) : null}
    </section>
  );
}

function Economia({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading } = useDettaglio("asia,redditi,profilo");
  const lavoro = asRecord(kpi.lavoro_profilo);
  const redditiKpi = asRecord(kpi.redditi_mef);
  const imprese = asRecord(kpi.imprese_asia);

  const asia = asRecord(detail?.asia);
  const serie = asRecord(asia?.serie_storica);
  const topSettori = Array.isArray(asRecord(asia?.kpi)?.top_settori_ul)
    ? (asRecord(asia?.kpi)?.top_settori_ul as Array<{ label?: string; code?: string; ul?: number; addetti?: number }>)
    : [];
  const topAteco = Array.isArray(asia?.top_ateco)
    ? (asia.top_ateco as Array<{ code: string; ul: number; addetti: number }>)
    : [];
  const mixAddetti = asRecord(asRecord(asia?.kpi)?.mix_classe_addetti);

  const redditi = asRecord(detail?.redditi);
  const trend = Array.isArray(redditi?.trend)
    ? (redditi.trend as Array<{ anno: number; reddito_medio: number; contribuenti: number; imposta_media: number }>)
    : [];
  const fasce = asRecord(asRecord(redditi?.latest)?.fasce);
  const lavoroExt = asRecord(asRecord(detail?.profilo)?.lavoro);

  const fasceEntries = fasce
    ? Object.values(fasce)
        .map((v) => asRecord(v))
        .filter((v): v is Record<string, unknown> => Boolean(v && v.label))
    : [];

  return (
    <section>
      <SectionIntro title={t("Economia & Lavoro")} description={t("Redditi MEF (serie e fasce), profilo occupazionale ISTAT e imprese ASIA con ATECO.")} />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={t("Tasso occupazione")} value={valueOrMissing(lavoro?.tasso_occupazione, formatPercent)} hint={lavoroExt ? `${formatInteger(num(lavoroExt.occupati_n))} occupati` : undefined} />
        <KpiCard label={t("Tasso disoccupazione")} value={valueOrMissing(lavoro?.tasso_disoccupazione, formatPercent)} hint={lavoroExt ? `${formatInteger(num(lavoroExt.in_cerca_n))} in cerca` : undefined} />
        <KpiCard label={t("Tasso di attività")} value={valueOrMissing(lavoro?.tasso_attivita, formatPercent)} />
        <KpiCard label={t("Reddito medio")} value={valueOrMissing(redditiKpi?.reddito_medio_eur, formatEuro)} hint={`Imposta media ${formatEuro(num(redditiKpi?.imposta_netta_media_eur))}`} />
        <KpiCard label={t("Unità locali")} value={valueOrMissing(imprese?.ul_totali, formatInteger)} hint={imprese?.ul_yoy_pct != null ? `YoY ${formatPercent(num(imprese.ul_yoy_pct))}` : undefined} />
        <KpiCard label={t("Addetti totali")} value={valueOrMissing(imprese?.addetti_totali, (v) => formatDecimal(v, 0))} hint={`Addetti/UL ${formatDecimal(num(imprese?.addetti_per_ul), 2)}`} />
        <KpiCard label={t("UL per 1000 ab.")} value={valueOrMissing(imprese?.ul_per_1000_ab, (v) => formatDecimal(v, 1))} />
        <KpiCard label={t("Contribuenti")} value={valueOrMissing(redditiKpi?.n_contribuenti, formatInteger)} hint={redditiKpi?.anno_fiscale ? `Anno fiscale ${redditiKpi.anno_fiscale}` : undefined} />
      </div>

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {trend.length > 0 ? (
          <div className="panel">
            <h3>{t("Trend reddito medio MEF")}</h3>
            <LineChart
              labels={trend.map((t) => String(t.anno))}
              datasets={[
                { label: "Reddito medio €", data: trend.map((t) => t.reddito_medio), color: "#0066CC" },
                { label: "Imposta media €", data: trend.map((t) => t.imposta_media), color: "#D9364F" },
              ]}
            />
          </div>
        ) : null}
        {fasceEntries.length > 0 ? (
          <div className="panel">
            <h3>{t("Distribuzione contribuenti per fascia di reddito")}</h3>
            <BarChart
              labels={fasceEntries.map((f) => String(f.label))}
              datasets={[{ label: "Contribuenti", data: fasceEntries.map((f) => num(f.freq) ?? 0) }]}
            />
          </div>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {serie && Array.isArray(serie.anni) ? (
          <div className="panel">
            <h3>{t("Serie storica unità locali ASIA")}</h3>
            <LineChart
              labels={(serie.anni as number[]).map(String)}
              datasets={[
                { label: "Unità locali", data: (serie.ul as number[]) ?? [], color: "#0066CC" },
                { label: "Addetti", data: ((serie.addetti as number[]) ?? []).map((n) => Math.round(n)), color: "#008758" },
              ]}
            />
          </div>
        ) : null}
        {mixAddetti ? (
          <div className="panel">
            <h3>{t("Mix classe addetti (UL %)")}</h3>
            <DoughnutChart
              labels={["0–9", "10–49", "50–249"]}
              values={[num(mixAddetti.W0_9) ?? 0, num(mixAddetti.W10_49) ?? 0, num(mixAddetti.W50_249) ?? 0]}
            />
          </div>
        ) : null}
      </div>

      {topSettori.length > 0 ? (
        <div className="mb-4 panel">
          <h3>{t("Top settori ASIA (unità locali)")}</h3>
          <BarChart
            labels={topSettori.map((s) => String(s.label ?? s.code ?? "").slice(0, 42))}
            datasets={[
              { label: "UL", data: topSettori.map((s) => s.ul ?? 0) },
              { label: "Addetti", data: topSettori.map((s) => Math.round(s.addetti ?? 0)), color: "#008758" },
            ]}
          />
        </div>
      ) : topAteco.length > 0 ? (
        <div className="mb-4 panel">
          <h3>{t("Top codici ATECO")}</h3>
          <BarChart labels={topAteco.map((s) => s.code)} datasets={[{ label: "UL", data: topAteco.map((s) => s.ul) }]} />
        </div>
      ) : null}

    </section>
  );
}

function monthLabelIt(raw: string): string {
  const mesi = [
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
  const n = Number(String(raw).replace(/^0+/, "") || raw);
  if (n >= 1 && n <= 12) return mesi[n - 1]!;
  return String(raw);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Finanza({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading } = useDettaglio("siope,anac,bdap,pnrr,patrimonio");
  const siopeKpi = asRecord(kpi.siope);
  const anacKpi = asRecord(kpi.contratti_anac);
  const opereKpi = asRecord(kpi.opere_bdap);
  const pnrrKpi = asRecord(kpi.pnrr);
  const patrimonioKpi = asRecord(kpi.patrimonio_pa);

  const siope = asRecord(detail?.siope);
  const anac = asRecord(detail?.anac);
  const bdap = asRecord(detail?.bdap_kpi);
  const pnrr = asRecord(detail?.pnrr);
  const patrimonio = asRecord(detail?.immobili_pa);
  const patrimonioDetailKpi = asRecord(patrimonio?.kpi);
  const topCpv = Array.isArray(anac?.top_cpv)
    ? (anac.top_cpv as Array<{ desc?: string; code?: string; importo?: number; count?: number }>)
    : [];
  const cpvAll = Array.isArray(anac?.cpv)
    ? (anac.cpv as Array<{ desc?: string; code?: string; importo?: number; count?: number }>)
    : topCpv;
  const topSettori = Array.isArray(bdap?.top_settori)
    ? (bdap.top_settori as Array<{ settore?: string; count?: number; costo?: number }>)
    : [];
  const bdapStati = asRecord(bdap?.per_stato);
  const bdapTotale = asRecord(bdap?.totale);
  const missioni = Array.isArray(pnrr?.per_missione)
    ? (pnrr.per_missione as Array<{ missione?: string; descrizione?: string; tot_pnrr?: number; n_progetti?: number }>)
    : [];
  const progettiPnrr = Array.isArray(pnrr?.progetti)
    ? (pnrr.progetti as Array<Record<string, unknown>>)
    : [];
  const progettiOpere = Array.isArray(asRecord(detail?.opere)?.progetti)
    ? (asRecord(detail?.opere)?.progetti as Array<Record<string, unknown>>)
    : [];
  const mixPat = asRecord(patrimonioDetailKpi?.mix_categoria);
  const mixNatura = asRecord(patrimonioDetailKpi?.mix_natura);
  const h3 = "m-0 mb-3 text-base font-bold text-[var(--pa-ink)]";

  const siopeTitle = [
    t("SIOPE mensile"),
    siope?.anno != null ? String(siope.anno) : "",
    siope?.parziale ? `(${t("parziale")})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section>
      <SectionIntro
        title={t("Finanza pubblica")}
        description={t(
          "SIOPE mensile, contratti ANAC, opere BDAP, PNRR e patrimonio immobiliare PA.",
        )}
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Uscite SIOPE")}
          value={valueOrMissing(siopeKpi?.totale_uscite_eur, formatEuroCompact)}
          hint={`${formatEuro(num(siopeKpi?.uscite_per_abitante_eur))} /ab.`}
          variant="danger"
        />
        <KpiCard
          label={t("Incassi SIOPE")}
          value={valueOrMissing(siopeKpi?.totale_incassi_eur, formatEuroCompact)}
          hint={`${formatEuro(num(siopeKpi?.incassi_per_abitante_eur))} /ab.`}
          variant="success"
        />
        <KpiCard
          label={t("Saldo cassa")}
          value={valueOrMissing(siopeKpi?.saldo_cassa_eur, formatEuroCompact)}
          hint={siopeKpi?.anno != null ? `${t("Anno")} ${String(siopeKpi.anno)}` : undefined}
          variant="info"
        />
        <KpiCard
          label={t("Contratti ANAC")}
          value={valueOrMissing(anacKpi?.n_aggiudicazioni ?? anac?.count, formatInteger)}
          hint={valueOrMissing(
            anacKpi?.importo_totale_eur ?? anac?.importo_totale,
            formatEuroCompact,
          )}
        />
        <KpiCard
          label={t("Opere BDAP")}
          value={valueOrMissing(opereKpi?.n_progetti ?? bdapTotale?.count, formatInteger)}
          hint={valueOrMissing(opereKpi?.importo_totale_eur, formatEuroCompact)}
        />
        <KpiCard
          label={t("PNRR assegnato")}
          value={valueOrMissing(pnrrKpi?.importo_assegnato_eur, formatEuroCompact)}
          hint={`${formatInteger(num(pnrrKpi?.n_concluso))} ${t("conclusi")} / ${formatInteger(num(pnrrKpi?.n_in_corso))} ${t("in corso")}`}
        />
        <KpiCard
          label={t("Immobili PA")}
          value={valueOrMissing(
            patrimonioDetailKpi?.n_totale ?? patrimonioKpi?.n_immobili,
            formatInteger,
          )}
          hint={`${formatInteger(num(patrimonioDetailKpi?.n_fabbricati ?? patrimonioKpi?.n_fabbricati))} ${t("fabbricati")} · ${formatInteger(num(patrimonioDetailKpi?.n_terreni ?? patrimonioKpi?.n_terreni))} ${t("terreni")}`}
        />
        <KpiCard
          label={t("Superficie PA")}
          value={valueOrMissing(
            patrimonioDetailKpi?.superficie_totale_mq ?? patrimonioKpi?.superficie_totale_mq,
            (v) => `${formatInteger(v)} m²`,
          )}
          hint={
            patrimonioDetailKpi?.pct_geo_referenziati != null
              ? `${formatPercent(num(patrimonioDetailKpi.pct_geo_referenziati))} ${t("georeferenziati")}`
              : undefined
          }
        />
      </div>

      {loading ? <LoadingBlock /> : null}

      <OmiPanel />

      {siope?.disponibile ? (
        <div className="mb-4 panel">
          <h3 className={h3}>{siopeTitle}</h3>
          <p className="m-0 mb-3 text-xs text-[var(--pa-muted)] sm:text-sm">
            {t("Uscite")}: {formatEuroCompact(num(siope.totale_uscite ?? siopeKpi?.totale_uscite_eur))}
            {" · "}
            {t("Entrate")}: {formatEuroCompact(num(siope.totale_entrate ?? siopeKpi?.totale_incassi_eur))}
            {" · "}
            {t("Saldo cassa")}: {formatEuroCompact(num(siope.saldo_cassa ?? siopeKpi?.saldo_cassa_eur))}
          </p>
          <LineChart
            labels={((siope.labels as string[]) ?? []).map(monthLabelIt)}
            datasets={[
              {
                label: t("Uscite"),
                data: (siope.uscite_mensili as number[]) ?? [],
                color: "#D9364F",
              },
              {
                label: t("Entrate"),
                data: (siope.entrate_mensili as number[]) ?? [],
                color: "#008758",
              },
            ]}
          />
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {topCpv.length > 0 ? (
          <div className="panel">
            <h3 className={h3}>{t("Top CPV ANAC")}</h3>
            <p className="m-0 mb-3 text-xs text-[var(--pa-muted)] sm:text-sm">
              {String(anac?.buyer_name ?? t("Comune di San Vincenzo"))}
              {anac?.first_award_date || anac?.last_award_date
                ? ` · ${t("Aggiudicazioni")} ${String(anac?.first_award_date ?? "—")} → ${String(anac?.last_award_date ?? "—")}`
                : null}
              {anac?.distinct_cpv != null
                ? ` · ${formatInteger(num(anac.distinct_cpv))} CPV`
                : null}
            </p>
            <BarChart
              labels={topCpv.map((c) => String(c.desc ?? c.code ?? "").slice(0, 40))}
              datasets={[
                {
                  label: t("Importo €"),
                  data: topCpv.map((c) => c.importo ?? 0),
                  color: "#0066CC",
                },
              ]}
            />
          </div>
        ) : null}
        {topSettori.length > 0 ? (
          <div className="panel">
            <h3 className={h3}>{t("Opere BDAP per settore")}</h3>
            {bdapStati ? (
              <p className="m-0 mb-3 text-xs text-[var(--pa-muted)] sm:text-sm">
                {Object.entries(bdapStati)
                  .map(([stato, info]) => {
                    const rec = asRecord(info);
                    return `${humanizeKey(stato)}: ${formatInteger(num(rec?.count))}`;
                  })
                  .join(" · ")}
              </p>
            ) : null}
            <BarChart
              labels={topSettori.map((s) => String(s.settore ?? "").slice(0, 36))}
              datasets={[
                {
                  label: t("Costo €"),
                  data: topSettori.map((s) => s.costo ?? 0),
                  color: "#CC7A00",
                },
              ]}
            />
          </div>
        ) : null}
      </div>

      {cpvAll.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel p-0">
          <h3 className={`px-3 pt-3 sm:px-4 sm:pt-4 ${h3}`}>{t("Contratti ANAC per CPV")}</h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("CPV")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Descrizione")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("N.")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Importo")}</th>
              </tr>
            </thead>
            <tbody>
              {cpvAll.map((c) => (
                <tr key={String(c.code ?? c.desc)} className="border-t border-[#eef2f5]">
                  <td className="whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2">
                    {String(c.code ?? "—")}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(c.desc ?? "—")}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{formatInteger(num(c.count))}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {formatEuroCompact(num(c.importo))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {missioni.length > 0 ? (
        <div className="mb-4 panel">
          <h3 className={h3}>{t("PNRR per missione")}</h3>
          <ul className="m-0 list-none space-y-2 p-0 text-xs sm:text-sm">
            {missioni.map((m) => (
              <li
                key={String(m.missione)}
                className="rounded-lg border border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-3 py-2"
              >
                <strong>
                  {m.missione} — {m.descrizione}
                </strong>
                <span className="mt-0.5 block text-[var(--pa-muted)]">
                  {formatInteger(num(m.n_progetti))} {t("progetti")} ·{" "}
                  {formatEuroCompact(num(m.tot_pnrr))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {progettiPnrr.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel p-0">
          <h3 className={`px-3 pt-3 sm:px-4 sm:pt-4 ${h3}`}>
            {t("Progetti PNRR")} ({formatInteger(progettiPnrr.length)})
          </h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Titolo")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Missione")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Stato")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Finanziamento")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Fine")}</th>
              </tr>
            </thead>
            <tbody>
              {progettiPnrr.map((p) => (
                <tr key={String(p.cup)} className="border-t border-[#eef2f5]">
                  <td className="max-w-sm px-2 py-1.5 sm:px-3 sm:py-2">
                    {String(p.titolo)}
                    {p.cup ? (
                      <span className="mt-0.5 block text-[10px] text-[var(--pa-muted)]">
                        CUP {String(p.cup)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {String(p.missione ?? "—")}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {String(p.stato_avanzamento ?? "—")}
                    {p.fase_iter ? (
                      <span className="mt-0.5 block text-[10px] text-[var(--pa-muted)]">
                        {String(p.fase_iter)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {formatEuroCompact(num(p.finanziamento_pnrr))}
                    {p.finanziamento_totale != null ? (
                      <span className="mt-0.5 block text-[10px] text-[var(--pa-muted)]">
                        {t("Totale")} {formatEuroCompact(num(p.finanziamento_totale))}
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2">
                    {String(p.data_fine_effettiva ?? p.data_fine_prevista ?? "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {progettiOpere.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel p-0">
          <h3 className={`px-3 pt-3 sm:px-4 sm:pt-4 ${h3}`}>
            {t("Opere BDAP")} ({formatInteger(progettiOpere.length)}
            {asRecord(detail?.opere)?.n_progetti != null
              ? ` / ${formatInteger(num(asRecord(detail?.opere)?.n_progetti))}`
              : null}
            )
          </h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Descrizione")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Settore")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Stato")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Costo prev.")}</th>
              </tr>
            </thead>
            <tbody>
              {progettiOpere.slice(0, 30).map((p) => (
                <tr key={String(p.cup ?? p.descrizione)} className="border-t border-[#eef2f5]">
                  <td className="max-w-md px-2 py-1.5 sm:px-3 sm:py-2">
                    {String(p.descrizione)}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.settore ?? "—")}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.stato ?? "—")}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {formatEuroCompact(num(p.costo_prev))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {mixPat || mixNatura ? (
        <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
          {mixPat ? (
            <div className="panel">
              <h3 className={h3}>{t("Patrimonio PA — mix categorie")}</h3>
              <BarChart
                labels={Object.keys(mixPat).map(humanizeKey)}
                datasets={[
                  {
                    label: t("N. immobili"),
                    data: Object.values(mixPat).map((v) => Number(v) || 0),
                    color: "#0066CC",
                  },
                ]}
              />
            </div>
          ) : null}
          {mixNatura ? (
            <div className="panel">
              <h3 className={h3}>{t("Patrimonio PA — natura")}</h3>
              <DoughnutChart
                labels={Object.keys(mixNatura).map(humanizeKey)}
                values={Object.values(mixNatura).map((v) => Number(v) || 0)}
              />
              {patrimonioDetailKpi?.pct_vincolo_culturale != null ? (
                <p className="mb-0 mt-3 text-xs text-[var(--pa-muted)] sm:text-sm">
                  {t("Con vincolo culturale")}:{" "}
                  {formatPercent(num(patrimonioDetailKpi.pct_vincolo_culturale))}
                  {patrimonioDetailKpi.pct_uso_terzi != null
                    ? ` · ${t("Uso terzi")}: ${formatPercent(num(patrimonioDetailKpi.pct_uso_terzi))}`
                    : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Territorio({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading } = useDettaglio("territorio,morfologia");
  const ambiente = asRecord(kpi.ambiente);
  const morfoKpi = asRecord(kpi.morfologia_cnr);
  const anagrafica = asRecord(kpi.anagrafica);

  const territorio = asRecord(detail?.territorio);
  const alluvioni = asRecord(asRecord(territorio?.rischio_idrogeologico)?.alluvioni);
  const frane = asRecord(asRecord(territorio?.rischio_idrogeologico)?.frane);
  const morfo = asRecord(asRecord(detail?.morfologia)?.stats) ?? morfoKpi;
  const aspect = asRecord(morfo?.aspect_dist);
  const geomorph = asRecord(morfo?.geomorph);
  const sismica = asRecord(territorio?.classificazione_sismica);

  return (
    <section>
      <SectionIntro
        title={t("Territorio")}
        description={t("Morfologia CNR-IRPI, rischio idrogeologico e classificazione sismica. Suolo e rifiuti sono in Ambiente.")}
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Superficie")}
          value={valueOrMissing(ambiente?.superficie_kmq, (v) => `${formatDecimal(v, 2)} km²`)}
          icon={LandPlot}
        />
        <KpiCard label={t("Zona sismica")} value={sismica?.zona_sismica ? `Zona ${sismica.zona_sismica}` : "n.d."} />
        <KpiCard
          label={t("Elevazione media")}
          value={valueOrMissing(morfo?.elev_mean, (v) => `${formatInteger(v)} m`)}
          hint={`min ${formatInteger(num(morfo?.elev_min))} · max ${formatInteger(num(morfo?.elev_max))}`}
          icon={Mountain}
        />
        <KpiCard
          label={t("Pendenza media")}
          value={valueOrMissing(morfo?.slope_mean, (v) => `${formatDecimal(v, 1)}°`)}
          hint={`>${15}°: ${formatPercent(num(morfo?.slope_gt15_pct))}`}
        />
        <KpiCard label={t("Esposizione dominante")} value={morfo?.aspect_dom ? String(morfo.aspect_dom) : "n.d."} />
        <KpiCard
          label={t("CF / Catastale")}
          value={`${String(anagrafica?.codice_fiscale ?? "n.d.")}`}
          hint={`Catastale ${String(anagrafica?.codice_catastale ?? "")}`}
        />
      </div>

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {alluvioni ? (
          <div className="panel">
            <h3>{t("Rischio alluvioni (popolazione esposta)")}</h3>
            <BarChart
              labels={["P3 alto", "P2 medio", "P1 basso"]}
              datasets={[{ label: "Abitanti", data: [num(alluvioni.pop_p3) ?? 0, num(alluvioni.pop_p2) ?? 0, num(alluvioni.pop_p1) ?? 0], color: "#0066CC" }]}
            />
            <p className="mt-2 text-[11px] text-[#5b6f82] sm:text-xs">
              Area P3 {formatDecimal(num(alluvioni.ar_p3_kmq), 2)} km² · P2 {formatDecimal(num(alluvioni.ar_p2_kmq), 2)} km² · P1 {formatDecimal(num(alluvioni.ar_p1_kmq), 2)} km²
            </p>
          </div>
        ) : null}
        {frane ? (
          <div className="panel">
            <h3>{t("Rischio frane")}</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li>Area P3+P4: {formatDecimal(num(frane.ar_p3p4_kmq), 2)} km² ({formatPercent(num(frane.ar_p3p4_pct))})</li>
              <li>Popolazione P3+P4: {formatInteger(num(frane.pop_p3p4))} ({formatPercent(num(frane.pop_p3p4_pct))})</li>
              <li>Edifici P3+P4: {formatInteger(num(frane.ed_p3p4))}</li>
            </ul>
          </div>
        ) : null}
      </div>

      <RischioPanel />

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {aspect ? (
          <div className="panel">
            <h3>{t("Esposizione versanti (%)")}</h3>
            <BarChart labels={Object.keys(aspect)} datasets={[{ label: "%", data: Object.values(aspect).map((v) => Number(v) || 0) }]} />
          </div>
        ) : null}
        {geomorph ? (
          <div className="panel">
            <h3>{t("Geomorfologia (%)")}</h3>
            <BarChart labels={Object.keys(geomorph)} datasets={[{ label: "%", data: Object.values(geomorph).map((v) => Number(v) || 0), color: "#5B2C6F" }]} />
          </div>
        ) : null}
      </div>

      {morfo ? (
        <div className="panel">
          <h3>{t("Rilievo 3D stilizzato (morfologia)")}</h3>
          <Terrain3D
            elevMin={num(morfo.elev_min) ?? 0}
            elevMax={num(morfo.elev_max) ?? 100}
            elevMean={num(morfo.elev_mean) ?? 50}
            slopeMean={num(morfo.slope_mean) ?? 5}
          />
        </div>
      ) : null}
    </section>
  );
}

function FuelPriceCell({
  value,
  isBest,
}: {
  value: number | null;
  isBest: boolean;
}) {
  const t = useT();
  if (value == null) return <span>—</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={isBest ? "font-bold text-[#008758]" : undefined}>
        {formatDecimal(value, 3)}
      </span>
      {isBest ? (
        <span className="rounded bg-[#008758] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Miglior prezzo
        </span>
      ) : null}
    </span>
  );
}

function Infra({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading } = useDettaglio("ev,pendolarismo,veicoli,banda,carburanti");
  const banda = asRecord(kpi.banda_larga_agcom);
  const ev = asRecord(kpi.ricarica_ev_pun);
  const veicoli = asRecord(kpi.veicoli_aci);
  const pendol = asRecord(kpi.pendolarismo);

  const agcom = asRecord(detail?.agcom_bbmap);
  const pun = asRecord(detail?.pun);
  const punKpi = asRecord(pun?.kpi) ?? ev;
  const mixPotenza = asRecord(punKpi?.mix_potenza);
  const pend = asRecord(asRecord(detail?.pendolarismo)?.kpi) ?? pendol;
  const topDest = Array.isArray(pend?.top_destinazioni) ? (pend.top_destinazioni as Array<{ istat?: string; count?: number }>) : [];
  const topOrig = Array.isArray(pend?.top_origini) ? (pend.top_origini as Array<{ istat?: string; count?: number }>) : [];
  const veicoliExt = asRecord(detail?.veicoli);
  const parco = asRecord(veicoliExt?.parco_veicoli);
  const euro = asRecord(parco?.euro);
  const iscrizioni = asRecord(asRecord(veicoliExt?.iscrizioni)?.ultimo_anno);
  const incidenti = asRecord(asRecord(veicoliExt?.incidenti)?.ultimo_anno);
  const serieInc = asRecord(asRecord(veicoliExt?.incidenti)?.serie_storica);
  const carb = asRecord(detail?.carburanti);
  const carbKpi = asRecord(carb?.kpi);
  const impianti = useMemo(
    () =>
      Array.isArray(carb?.punti)
        ? (carb.punti as Array<Record<string, unknown>>)
        : [],
    [carb?.punti],
  );
  const prezzoMedio = asRecord(carbKpi?.prezzo_medio);

  const bestBenzina = useMemo(() => {
    let min: number | null = null;
    for (const p of impianti) {
      const v = num(asRecord(p.prezzi)?.benzina_self);
      if (v != null && (min == null || v < min)) min = v;
    }
    return min;
  }, [impianti]);

  const bestGasolio = useMemo(() => {
    let min: number | null = null;
    for (const p of impianti) {
      const v = num(asRecord(p.prezzi)?.gasolio_self);
      if (v != null && (min == null || v < min)) min = v;
    }
    return min;
  }, [impianti]);

  const impiantiOrdinati = useMemo(() => {
    return [...impianti].sort((a, b) => {
      const pa = num(asRecord(a.prezzi)?.benzina_self) ?? Number.POSITIVE_INFINITY;
      const pb = num(asRecord(b.prezzi)?.benzina_self) ?? Number.POSITIVE_INFINITY;
      return pa - pb;
    });
  }, [impianti]);

  return (
    <section>
      <SectionIntro
        title={t("Mobilità")}
        description={t(
          "Trasporto pubblico (GTFS Toscana), ciclabili e pedonali, banda larga, ricarica EV, veicoli, incidenti, pendolarismo e carburanti.",
        )}
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label={t("Copertura FTTH")} value={valueOrMissing(banda?.copertura_ftth_pct ?? asRecord(agcom?.kpi)?.copertura_ftth_desi_pct, formatPercent)} hint={`FTTH 20m ${formatPercent(num(banda?.copertura_ftth_20m_pct ?? asRecord(agcom?.kpi)?.copertura_ftth_20m_pct))}`} />
        <KpiCard label={t("Punti ricarica EV")} value={valueOrMissing(punKpi?.n_totale, formatInteger)} hint={`${formatInteger(num(punKpi?.n_attivi))} attivi · ${formatDecimal(num(punKpi?.potenza_tot_kw ?? punKpi?.potenza_totale_kw), 0)} kW`} />
        <KpiCard label={t("Veicoli")} value={valueOrMissing(veicoli?.totale_veicoli ?? parco?.totale, formatInteger)} hint={`${formatDecimal(num(veicoli?.tasso_motorizzazione_per_1000_ab ?? parco?.tasso_motorizzazione_per_1000_ab), 0)} /1000 ab.`} />
        <KpiCard label={t("Pendolarismo netto")} value={valueOrMissing(pend?.saldo_netto, formatInteger)} hint={`Auto-contenimento ${formatPercent(num(pend?.auto_contenimento_pct))}`} />
        <KpiCard label={t("% veicoli inquinanti")} value={valueOrMissing(veicoli?.pct_inquinanti ?? euro?.pct_inquinanti, formatPercent)} />
        <KpiCard label={t("Incidenti (ultimo anno)")} value={valueOrMissing(incidenti?.incidenti, formatInteger)} hint={incidenti ? `${formatInteger(num(incidenti.morti))} morti · ${formatInteger(num(incidenti.feriti))} feriti` : undefined} />
        <KpiCard label={t("Impianti carburanti")} value={valueOrMissing(carbKpi?.n_impianti ?? asRecord(kpi.carburanti_mimit)?.n_impianti, formatInteger)} />
        <KpiCard
          label={t("Benzina self media")}
          value={valueOrMissing(
            prezzoMedio?.benzina_self ??
              asRecord(kpi.carburanti_mimit)?.prezzo_medio_benzina_self,
            (v) => `${formatDecimal(v, 3)} €/L`,
          )}
          icon={Car}
        />
        <KpiCard
          label={t("Gasolio self media")}
          value={valueOrMissing(prezzoMedio?.gasolio_self, (v) => `${formatDecimal(v, 3)} €/L`)}
          icon={Car}
        />
        <KpiCard
          label={t("Miglior benzina self")}
          value={valueOrMissing(bestBenzina, (v) => `${formatDecimal(v, 3)} €/L`)}
          hint={t("Prezzo più basso nel comune")}
          variant="success"
        />
        <KpiCard
          label={t("Miglior gasolio self")}
          value={valueOrMissing(bestGasolio, (v) => `${formatDecimal(v, 3)} €/L`)}
          hint={t("Prezzo più basso nel comune")}
          variant="success"
        />
      </div>

      {impiantiOrdinati.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel p-0">
          <div className="px-3 pt-3 sm:px-4 sm:pt-4">
            <h3 className="m-0 flex items-center gap-2">
              <Fuel
                size={20}
                className="shrink-0 text-[var(--pa-primary)]"
                strokeWidth={2}
                aria-hidden
              />
              Impianti carburanti
            </h3>
            <p className="mb-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
              Ordinati per benzina self crescente. Badge verde = prezzo migliore
              tra gli impianti del comune.
            </p>
          </div>
          <table className="mt-2 min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
            <thead className="bg-[#e8f2fc]">
              <tr>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Impianto")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Bandiera")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Benzina self")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Gasolio self")}</th>
                <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Aggiornato")}</th>
              </tr>
            </thead>
            <tbody>
              {impiantiOrdinati.map((p) => {
                const prezzi = asRecord(p.prezzi);
                const benzina = num(prezzi?.benzina_self);
                const gasolio = num(prezzi?.gasolio_self);
                const isBestBenzina =
                  benzina != null && bestBenzina != null && benzina === bestBenzina;
                const isBestGasolio =
                  gasolio != null && bestGasolio != null && gasolio === bestGasolio;
                return (
                  <tr
                    key={String(p.name)}
                    className={`border-t border-[#eef2f5] ${
                      isBestBenzina || isBestGasolio ? "bg-[#f0faf4]" : ""
                    }`}
                  >
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <strong>{String(p.name)}</strong>
                      <br />
                      <span className="text-[#5b6f82]">{String(p.indirizzo ?? "")}</span>
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.brand ?? "")}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <FuelPriceCell value={benzina} isBest={isBestBenzina} />
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <FuelPriceCell value={gasolio} isBest={isBestGasolio} />
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.ultimo_aggiornamento ?? "—")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="m-0 border-t border-[#eef2f5] px-3 py-2 text-xs text-[#5b6f82] sm:px-4">
            Fonte prezzi: MIMIT / Osservatorio carburanti via Cruscotto Italia.
          </p>
        </div>
      ) : null}

      <div className="mb-4">
        <CarburantiMap />
      </div>

      <div className="mb-6">
        <TrasportiPanel embedded />
      </div>

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {mixPotenza ? (
          <div className="panel">
            <h3>{t("Mix potenza punti EV")}</h3>
            <DoughnutChart labels={Object.keys(mixPotenza)} values={Object.values(mixPotenza).map((v) => Number(v) || 0)} />
          </div>
        ) : null}
        {iscrizioni ? (
          <div className="panel">
            <h3 className="m-0 mb-3 text-base font-bold text-[var(--pa-ink)]">
              {t("Nuove iscrizioni veicoli")} {String(iscrizioni.anno ?? "")}
            </h3>
            <DoughnutChart
              labels={["Benzina", "Gasolio", "Elettriche", "Ibride", "Gas/GPL"]}
              values={[num(iscrizioni.benzina) ?? 0, num(iscrizioni.gasolio) ?? 0, num(iscrizioni.elettriche) ?? 0, num(iscrizioni.ibride) ?? 0, num(iscrizioni.gas_metano_gpl) ?? 0]}
            />
          </div>
        ) : null}
      </div>

      {euro ? (
        <div className="mb-4 panel">
          <h3>{t("Parco veicoli per classe Euro")}</h3>
          <BarChart
            labels={["Euro 0", "1", "2", "3", "4", "5", "6"]}
            datasets={[{
              label: "Veicoli",
              data: [num(euro.euro_0) ?? 0, num(euro.euro_1) ?? 0, num(euro.euro_2) ?? 0, num(euro.euro_3) ?? 0, num(euro.euro_4) ?? 0, num(euro.euro_5) ?? 0, num(euro.euro_6) ?? 0],
            }]}
          />
        </div>
      ) : null}

      {serieInc && Array.isArray(serieInc.anni) ? (
        <div className="mb-4 panel">
          <h3>{t("Serie incidenti stradali")}</h3>
          <LineChart
            labels={(serieInc.anni as Array<string | number>).map(String)}
            datasets={[
              { label: "Incidenti", data: (serieInc.incidenti as number[]) ?? [], color: "#CC7A00" },
              { label: "Feriti", data: (serieInc.feriti as number[]) ?? [], color: "#D9364F" },
            ]}
          />
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {topDest.length > 0 ? (
          <div className="panel">
            <h3>{t("Top destinazioni pendolari")}</h3>
            <BarChart
              labels={topDest.map((d) => COMUNI_LOOKUP[String(d.istat)] ?? String(d.istat))}
              datasets={[{ label: "Persone", data: topDest.map((d) => d.count ?? 0), color: "#0066CC" }]}
            />
          </div>
        ) : null}
        {topOrig.length > 0 ? (
          <div className="panel">
            <h3>{t("Top origini pendolari")}</h3>
            <BarChart
              labels={topOrig.map((d) => COMUNI_LOOKUP[String(d.istat)] ?? String(d.istat))}
              datasets={[{ label: "Persone", data: topOrig.map((d) => d.count ?? 0), color: "#008758" }]}
            />
          </div>
        ) : null}
      </div>

      <div className="mb-4">
        <EvPrezziPanel />
      </div>

      <div className="mb-4">
        <PunIdrMap />
      </div>

      <div className="mb-4">
        <BandaUltralargaPanel
          ftthPct={num(
            banda?.copertura_ftth_pct ?? asRecord(agcom?.kpi)?.copertura_ftth_desi_pct,
          )}
          ftth20mPct={num(
            banda?.copertura_ftth_20m_pct ?? asRecord(agcom?.kpi)?.copertura_ftth_20m_pct,
          )}
        />
      </div>
    </section>
  );
}

function Sanita({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading } = useDettaglio("sanita");
  const sanita = asRecord(kpi.sanita_mds);
  const sanitaExt = asRecord(detail?.sanita_mds);
  const farmacie = Array.isArray(asRecord(sanitaExt?.farmacie)?.punti)
    ? (asRecord(sanitaExt?.farmacie)?.punti as Array<Record<string, unknown>>)
    : [];
  const para = Array.isArray(asRecord(sanitaExt?.parafarmacie)?.punti)
    ? (asRecord(sanitaExt?.parafarmacie)?.punti as Array<Record<string, unknown>>)
    : [];
  const ospedali = sanitaExt?.ospedali;

  return (
    <section>
      <SectionIntro
        title={t("Sanità")}
        description={t(
          "Farmacie di turno, mappa MDS, defibrillatori DAE su OpenStreetMap e anagrafe Ministero della Salute. Il terzo settore è in Società.",
        )}
        sourceNote={t(
          "Ospedali: nel territorio comunale non risultano strutture dall’anagrafe MDS; i punti di riferimento più vicini sono fuori comune.",
        )}
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        <KpiCard label={t("Farmacie")} value={valueOrMissing(sanita?.n_farmacie, formatInteger)} icon={Heart} variant="info" />
        <KpiCard label={t("Parafarmacie")} value={valueOrMissing(sanita?.n_parafarmacie, formatInteger)} icon={Pill} />
        <KpiCard
          label={t("Ospedali")}
          value={
            typeof sanita?.n_ospedali === "number"
              ? formatInteger(sanita.n_ospedali)
              : "dato non disponibile"
          }
          unavailable={
            !(typeof sanita?.n_ospedali === "number" && sanita.n_ospedali > 0) &&
            ospedali == null
          }
          hint={t("Nessuna struttura ospedaliera nel comune (MDS)")}
          icon={Stethoscope}
        />
      </div>

      {!(typeof sanita?.n_ospedali === "number" && sanita.n_ospedali > 0) &&
      ospedali == null ? (
        <div className="mb-4">
          <DataUnavailable
            message={t("Ospedali e pronto soccorso")}
            hint={t(
              "San Vincenzo non ha un ospedale nel territorio comunale. Per emergenze usa il 118; farmacie di turno e DAE sono mappati qui sotto. Se conosci una struttura da aggiungere, segnalala in Partecipa.",
            )}
          />
        </div>
      ) : null}

      <div className="mb-4">
        <FarmacieTurno />
      </div>

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4">
        <FarmacieMap />
      </div>

      <div className="mb-4">
        <DaeMap />
      </div>

      {(farmacie.length > 0 || para.length > 0) ? (
        <p className="text-xs text-[var(--pa-muted)] sm:text-sm">
          Anagrafe MDS: {farmacie.length} farmacie e {para.length} parafarmacie
          (vedi mappa sopra). I turni sono aggiornati dalla fonte dedicata.
        </p>
      ) : null}
    </section>
  );
}

function Ambiente({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const { detail, loading: loadingTerr } = useDettaglio("territorio");
  const [balneazione, setBalneazione] = useState<Record<string, unknown> | null>(null);
  const [aria, setAria] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch("/api/arpat/balneazione").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/arpat/aria").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([baln, ar]) => {
        if (!cancelled) {
          setBalneazione(baln);
          setAria(ar);
        }
      })
      .catch((err) => {
        console.error("Errore caricamento dati ambiente:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const ambiente = asRecord(kpi.ambiente);
  const ariaKpi = asRecord(kpi.aria_ispra);
  const territorio = asRecord(detail?.territorio);
  const rifiuti = asRecord(territorio?.rifiuti);
  const serieRifiuti = Array.isArray(rifiuti?.serie_storica)
    ? (rifiuti.serie_storica as Array<{ anno?: number; rd_pct?: number; kg_ab?: number }>)
    : [];
  const suolo = asRecord(territorio?.suolo);
  const serieSuolo = Array.isArray(suolo?.serie_storica)
    ? (suolo.serie_storica as Array<{ intervallo?: string; netto_ha?: number }>)
    : [];
  const aree = Array.isArray(balneazione?.aree)
    ? (balneazione.aree as Array<Record<string, unknown>>)
    : [];

  return (
    <section>
      <SectionIntro
        title={t("Ambiente")}
        description={t("Balneazione ARPAT, aria, raccolta differenziata e consumo di suolo.")}
        sourceNote={t(
          "Aria: nessuna stazione ISPRA nel comune — mostriamo le più vicine. Balneazione: stagione ARPAT.",
        )}
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Aree balneazione")}
          value={valueOrMissing(balneazione?.aree_totali, formatInteger)}
          hint={`${formatDecimal(num(balneazione?.km_costa_controllati), 1)} km costa`}
          icon={Waves}
          variant="info"
        />
        <KpiCard
          label={t("Classificazione eccellente")}
          value={valueOrMissing(
            balneazione?.classificazione_eccellente_pct,
            formatPercent,
          )}
          hint={`Anno ${String(balneazione?.anno ?? "2024")}`}
          icon={Droplets}
          variant="success"
        />
        <KpiCard
          label={t("Raccolta differenziata")}
          value={valueOrMissing(ambiente?.raccolta_differenziata_pct, formatPercent)}
          icon={Recycle}
          variant="success"
        />
        <KpiCard
          label={t("Rifiuti pro capite")}
          value={valueOrMissing(ambiente?.rifiuti_kg_per_abitante, (v) => `${formatInteger(v)} kg/ab`)}
          icon={Recycle}
        />
        <KpiCard
          label={t("Consumo di suolo")}
          value={valueOrMissing(ambiente?.consumo_suolo_pct, formatPercent)}
          hint={suolo ? `${formatDecimal(num(asRecord(suolo.stock_2024)?.ha), 1)} ha` : `${formatDecimal(num(ambiente?.superficie_kmq), 2)} km²`}
          icon={LandPlot}
          variant="warning"
        />
        <KpiCard
          label={t("Superamenti limiti 2024")}
          value={valueOrMissing(balneazione?.superamenti_2024, formatInteger)}
          icon={Droplets}
          variant={num(balneazione?.superamenti_2024) === 0 ? "success" : "warning"}
        />
        <KpiCard
          label={t("Stazione qualità aria")}
          value={
            aria?.disponibile === false || ariaKpi?.ha_stazione === false
              ? "Non presente"
              : "n.d."
          }
          unavailable={true}
          icon={Wind}
        />
      </div>

      {loading || loadingTerr ? <LoadingBlock label={t("Caricamento dati ambientali…")} /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {serieRifiuti.length > 0 ? (
          <div className="panel">
            <h3>{t("Serie raccolta differenziata")}</h3>
            <LineChart
              labels={serieRifiuti.map((r) => String(r.anno))}
              datasets={[
                { label: "% RD", data: serieRifiuti.map((r) => r.rd_pct ?? 0), color: "#008758" },
                { label: "kg/ab", data: serieRifiuti.map((r) => r.kg_ab ?? 0), color: "#CC7A00" },
              ]}
            />
          </div>
        ) : null}
        {serieSuolo.length > 0 ? (
          <div className="panel">
            <h3>{t("Incremento netto consumo di suolo (ha)")}</h3>
            <BarChart
              labels={serieSuolo.map((s) => String(s.intervallo))}
              datasets={[{ label: "ha netti", data: serieSuolo.map((s) => s.netto_ha ?? 0), color: "#D9364F" }]}
            />
          </div>
        ) : null}
      </div>

      {aree.length > 0 ? (
        <div className="mb-4 panel">
          <h3>{t("Aree di balneazione controllate ARPAT")}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
              <thead className="bg-[#e8f2fc] text-[#17324d]">
                <tr>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Area")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Classificazione")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Km costa")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Campionamenti")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Superamenti")}</th>
                </tr>
              </thead>
              <tbody>
                {aree.map((area) => (
                  <tr key={String(area.nome)} className="border-t border-[#eef2f5]">
                    <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                      {String(area.nome)}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          String(area.classificazione).toLowerCase().includes("eccellente")
                            ? "bg-[#e6f7ef] text-[#008758]"
                            : "bg-[#fff4e6] text-[#b36b00]"
                        }`}
                      >
                        {String(area.classificazione ?? "n.d.")}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatDecimal(num(area.km_costa), 2)}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatInteger(num(area.campionamenti))}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatInteger(num(area.superamenti))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-0 mt-2.5 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
            {t("Fonte:")}{" "}
            <a
              href="https://www.arpat.toscana.it/tema-ambientale/balneazione/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ARPAT - Acque di Balneazione
            </a>
            . Monitoraggio E. coli ed enterococchi intestinali stagione balneare 2024.
          </p>
        </div>
      ) : null}

      {aria?.disponibile === false || ariaKpi?.ha_stazione === false ? (
        <div className="mb-4">
          <DataUnavailable
            message={t("Qualità dell'aria")}
            hint={String(
              aria?.messaggio ??
                t(
                  "Nessuna stazione ISPRA nel territorio comunale. Di seguito le stazioni più vicine per orientamento.",
                ),
            )}
            action={
              Array.isArray(aria?.stazioni_piu_vicine) &&
              (aria.stazioni_piu_vicine as Array<Record<string, unknown>>).length >
                0 ? (
                <ul className="m-0 list-none space-y-1 p-0 text-xs sm:text-sm">
                  <li className="mb-1 font-semibold text-[var(--pa-ink)]">
                    {t("Stazioni più vicine:")}
                  </li>
                  {(
                    aria!.stazioni_piu_vicine as Array<Record<string, unknown>>
                  ).map((s) => (
                    <li key={String(s.nome)} className="text-[var(--pa-muted)]">
                      <strong className="text-[var(--pa-ink)]">
                        {String(s.nome)}
                      </strong>{" "}
                      — {formatInteger(num(s.distanza_km))} km
                    </li>
                  ))}
                </ul>
              ) : undefined
            }
          />
        </div>
      ) : null}

      <p className="mt-3 text-xs text-[#5b6f82] sm:mt-4 sm:text-sm">
        <strong>{t("Note:")}</strong> ARPAT effettua monitoraggi microbiologici settimanali
        nelle aree di balneazione durante la stagione (1 aprile - 30 settembre).
        La classificazione si basa sui dati degli ultimi 4 anni. San Vincenzo mantiene
        acque di qualità eccellente su tutta la costa.
      </p>
    </section>
  );
}

function formatClock(iso: unknown): string | null {
  if (typeof iso !== "string" || !iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function owIconUrl(icon: unknown): string | null {
  if (typeof icon !== "string" || !icon) return null;
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function Meteo({ kpi }: { kpi: Kpi }) {
  const t = useT();
  const [live, setLive] = useState<Record<string, unknown> | null>(null);
  const [forecast, setForecast] = useState<Record<string, unknown> | null>(null);
  const [openWeather, setOpenWeather] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallback = asRecord(kpi.meteo_italiameteo);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stamp = Date.now();
      const [kpiRes, fcRes, owRes] = await Promise.all([
        fetch(`/api/meteo?_=${stamp}`, { cache: "no-store" }),
        fetch(`/api/meteo/forecast?_=${stamp}`, { cache: "no-store" }),
        fetch(`/api/meteo/openweather?_=${stamp}`, { cache: "no-store" }),
      ]);
      if (kpiRes.ok) {
        const data = await kpiRes.json();
        setLive(asRecord(data.meteo));
      }
      if (fcRes.ok) {
        setForecast(await fcRes.json());
      }
      if (owRes.ok) {
        setOpenWeather(await owRes.json());
      }
      if (!kpiRes.ok && !fcRes.ok && !owRes.ok) {
        throw new Error("fetch failed");
      }
    } catch {
      setError(
        "Aggiornamento live non riuscito: mostro gli ultimi dati disponibili.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const meteo = live ?? fallback;
  const stats = useMemo(() => {
    if (!meteo) return null;
    return asRecord(meteo.osservazione) ?? asRecord(meteo.corrente) ?? meteo;
  }, [meteo]);

  const owCurrent = asRecord(openWeather?.current);
  const owAir = asRecord(openWeather?.air);
  const owDaily = Array.isArray(openWeather?.daily)
    ? (openWeather.daily as Record<string, unknown>[])
    : [];
  const owSlots = Array.isArray(openWeather?.forecast_3h)
    ? (openWeather.forecast_3h as Record<string, unknown>[])
    : [];

  const currentOm = asRecord(forecast?.current);
  const hourly = asRecord(forecast?.hourly);
  const daily = asRecord(forecast?.daily);
  const hourlyLabels = Array.isArray(hourly?.time)
    ? (hourly.time as string[]).map((t) =>
        new Date(t).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      )
    : [];
  const dailyLabels = Array.isArray(daily?.time)
    ? (daily.time as string[]).map((t) =>
        new Date(t).toLocaleDateString("it-IT", {
          weekday: "short",
          day: "numeric",
        }),
      )
    : [];
  const dailyDesc = Array.isArray(daily?.weather_desc)
    ? (daily.weather_desc as string[])
    : [];

  const weatherHint =
    String(
      owCurrent?.description ??
        currentOm?.weather_desc ??
        stats?.ww_desc ??
        "",
    ) || undefined;

  const aqi = num(owAir?.aqi);
  const aqiVariant: "default" | "success" | "info" | "danger" =
    aqi == null
      ? "default"
      : aqi <= 2
        ? "success"
        : aqi === 3
          ? "info"
          : "danger";

  return (
    <section>
      <SectionIntro
        title={t("Meteo")}
        description={t("Allerte Protezione Civile, condizioni live (OpenWeather + ItaliaMeteo/Cineca + Open-Meteo), qualità dell’aria, previsioni e radar precipitazioni RainViewer su mappa.")}
        sourceNote={t(
          "Dati live: aggiornamento automatico dalle API meteo; le allerte seguono la Protezione Civile.",
        )}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <SolidButton onClick={() => void load()}>{t("Aggiorna ora")}</SolidButton>
        {loading ? (
          <span className="text-xs text-[var(--pa-muted)] sm:text-sm">
            {t("Aggiornamento…")}
          </span>
        ) : null}
        {owCurrent?.dt ? (
          <span className="text-xs text-[var(--pa-muted)] sm:text-sm">
            {t("OpenWeather")}: {formatClock(owCurrent.dt)}
          </span>
        ) : null}
      </div>
      {error ? <DataUnavailable message={error} /> : null}

      <AllerteMeteoPanel />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Temperatura")}
          value={valueOrMissing(
            owCurrent?.temp_c ??
              currentOm?.temperature_2m ??
              stats?.t2m_c ??
              stats?.temp_c,
            (v) => `${formatDecimal(v, 1)} °C`,
          )}
          hint={weatherHint}
          icon={Thermometer}
          variant="info"
        />
        <KpiCard
          label={t("Percepita")}
          value={valueOrMissing(
            owCurrent?.feels_like_c ?? currentOm?.apparent_temperature,
            (v) => `${formatDecimal(v, 1)} °C`,
          )}
          icon={Thermometer}
        />
        <KpiCard
          label={t("Min / Max 24h (KPI)")}
          value={`${valueOrMissing(
            owCurrent?.temp_min_c ?? stats?.t2m_min24h_c,
            (v) => formatDecimal(v, 1),
          )} / ${valueOrMissing(
            owCurrent?.temp_max_c ?? stats?.t2m_max24h_c,
            (v) => formatDecimal(v, 1),
          )} °C`}
          icon={Thermometer}
        />
        <KpiCard
          label={t("Umidità")}
          value={valueOrMissing(
            owCurrent?.humidity_pct ??
              currentOm?.relative_humidity_2m ??
              stats?.umidita_pct,
            formatPercent,
          )}
          icon={Droplets}
          variant="info"
        />
        <KpiCard
          label={t("Vento")}
          value={valueOrMissing(
            owCurrent?.wind_kmh ??
              currentOm?.wind_speed_10m ??
              stats?.vento_kmh,
            (v) => `${formatDecimal(v, 1)} km/h`,
          )}
          hint={
            owCurrent?.wind_gust_kmh != null
              ? `Raffiche ${formatDecimal(num(owCurrent.wind_gust_kmh), 1)} km/h`
              : currentOm?.wind_gusts_10m != null
                ? `Raffiche ${formatDecimal(num(currentOm.wind_gusts_10m), 1)} km/h`
                : stats?.raffica_max24h_kmh != null
                  ? `Raffiche max ${formatDecimal(num(stats.raffica_max24h_kmh), 1)} km/h`
                  : undefined
          }
          icon={Wind}
        />
        <KpiCard
          label={t("Nuvolosità")}
          value={valueOrMissing(
            owCurrent?.clouds_pct ??
              currentOm?.cloud_cover ??
              stats?.nuvolosita_pct,
            formatPercent,
          )}
          icon={CloudRain}
        />
        <KpiCard
          label={t("Precipitazioni")}
          value={valueOrMissing(
            owCurrent?.rain_1h_mm ??
              currentOm?.precipitation ??
              stats?.prec_24h_mm,
            (v) => `${formatDecimal(v, 1)} mm`,
          )}
          hint={
            owCurrent?.rain_1h_mm != null
              ? t("Ultima ora (OpenWeather)")
              : stats?.prec_24h_mm != null
                ? "KPI: cumulate 24h se da ItaliaMeteo"
                : undefined
          }
          icon={Umbrella}
          variant={
            (num(
              owCurrent?.rain_1h_mm ??
                currentOm?.precipitation ??
                stats?.prec_24h_mm,
            ) ?? 0) > 5
              ? "info"
              : "default"
          }
        />
        <KpiCard
          label={t("Direzione vento")}
          value={
            owCurrent?.wind_deg != null ||
            currentOm?.wind_direction_10m != null ||
            stats?.vento_dir_deg != null
              ? `${formatInteger(
                  num(
                    owCurrent?.wind_deg ??
                      currentOm?.wind_direction_10m ??
                      stats?.vento_dir_deg,
                  ),
                )}°`
              : "n.d."
          }
          icon={Wind}
        />
        <KpiCard
          label={t("Pressione")}
          value={valueOrMissing(owCurrent?.pressure_hpa, (v) =>
            `${formatInteger(v)} hPa`,
          )}
          icon={Gauge}
        />
        <KpiCard
          label={t("Visibilità")}
          value={valueOrMissing(owCurrent?.visibility_m, (v) =>
            v >= 1000
              ? `${formatDecimal(v / 1000, 1)} km`
              : `${formatInteger(v)} m`,
          )}
          icon={Eye}
        />
        <KpiCard
          label={t("Qualità aria (AQI)")}
          value={
            aqi != null
              ? `${formatInteger(aqi)} · ${String(owAir?.aqi_label ?? "")}`
              : "n.d."
          }
          hint={
            owAir?.components
              ? `PM2.5 ${formatDecimal(num(asRecord(owAir.components)?.pm2_5), 1)} · PM10 ${formatDecimal(num(asRecord(owAir.components)?.pm10), 1)} µg/m³`
              : undefined
          }
          icon={Leaf}
          variant={aqiVariant}
        />
        <KpiCard
          label={t("Alba / Tramonto")}
          value={
            formatClock(owCurrent?.sunrise) && formatClock(owCurrent?.sunset)
              ? `${formatClock(owCurrent?.sunrise)} / ${formatClock(owCurrent?.sunset)}`
              : "n.d."
          }
          icon={Sunrise}
        />
      </div>

      {owSlots.length > 0 ? (
        <div className="mb-4 panel">
          <h3>{t("Prossime 24 ore (OpenWeather)")}</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {owSlots.map((slot, i) => {
              const icon = owIconUrl(slot.icon);
              return (
                <div
                  key={String(slot.dt ?? i)}
                  className="min-w-[4.75rem] shrink-0 rounded-lg border border-[#e6eef5] bg-[#f8fbfe] px-2 py-2 text-center"
                >
                  <div className="text-[11px] font-semibold text-[#17324d]">
                    {formatClock(slot.dt) ?? "—"}
                  </div>
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={icon}
                      alt={String(slot.description ?? "")}
                      width={48}
                      height={48}
                      className="mx-auto -my-1 h-12 w-12"
                    />
                  ) : (
                    <CloudSun className="mx-auto my-2 h-6 w-6 text-[#0066CC]" />
                  )}
                  <div className="text-sm font-bold text-[#17324d]">
                    {valueOrMissing(slot.temp_c, (v) => `${formatDecimal(v, 0)}°`)}
                  </div>
                  <div className="text-[10px] text-[#5b6f82]">
                    {slot.pop_pct != null
                      ? `${formatInteger(num(slot.pop_pct))}%`
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {owDaily.length > 0 ? (
        <div className="mb-4 panel">
          <h3>{t("Previsione 5 giorni (OpenWeather)")}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
              <thead className="bg-[#e8f2fc] text-[#17324d]">
                <tr>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Giorno")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Condizioni")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Min/Max")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Pioggia")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Prob.")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Vento max")}</th>
                </tr>
              </thead>
              <tbody>
                {owDaily.map((day) => {
                  const icon = owIconUrl(day.icon);
                  return (
                    <tr key={String(day.date)} className="border-t border-[#eef2f5]">
                      <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                        {String(day.label ?? day.date ?? "—")}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        <span className="inline-flex items-center gap-1">
                          {icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={icon}
                              alt=""
                              width={28}
                              height={28}
                              className="h-7 w-7"
                            />
                          ) : null}
                          {String(day.description ?? "—")}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {formatDecimal(num(day.temp_min_c), 1)}
                        {" / "}
                        {formatDecimal(num(day.temp_max_c), 1)} °C
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {formatDecimal(num(day.rain_mm), 1)} mm
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {day.pop_max != null
                          ? formatPercent(num(day.pop_max))
                          : "—"}
                      </td>
                      <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                        {day.wind_max_kmh != null
                          ? `${formatDecimal(num(day.wind_max_kmh), 0)} km/h`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <MeteoRadarMap />
      </div>

      {hourlyLabels.length > 0 ? (
        <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="panel">
            <h3>{t("Temperatura prossime 48 ore")}</h3>
            <LineChart
              labels={hourlyLabels}
              datasets={[
                {
                  label: "°C",
                  data: (hourly?.temperature_2m as number[]) ?? [],
                  color: "#D9364F",
                },
              ]}
            />
          </div>
          <div className="panel">
            <h3>{t("Precipitazioni e probabilità")}</h3>
            <LineChart
              labels={hourlyLabels}
              datasets={[
                {
                  label: "mm",
                  data: (hourly?.precipitation as number[]) ?? [],
                  color: "#0066CC",
                },
                {
                  label: "% probabilità",
                  data: (hourly?.precipitation_probability as number[]) ?? [],
                  color: "#008758",
                },
              ]}
            />
          </div>
        </div>
      ) : null}

      {dailyLabels.length > 0 ? (
        <div className="mb-4 panel">
          <h3>{t("Previsione 7 giorni")}</h3>
          <div className="mb-4">
            <LineChart
              labels={dailyLabels}
              datasets={[
                {
                  label: "Max °C",
                  data: (daily?.temperature_2m_max as number[]) ?? [],
                  color: "#D9364F",
                },
                {
                  label: "Min °C",
                  data: (daily?.temperature_2m_min as number[]) ?? [],
                  color: "#0066CC",
                },
              ]}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Tabella dati</caption>
              <thead className="bg-[#e8f2fc] text-[#17324d]">
                <tr>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Giorno")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Condizioni")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Min/Max")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Pioggia")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Prob.")}</th>
                  <th scope="col" className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Vento max")}</th>
                </tr>
              </thead>
              <tbody>
                {dailyLabels.map((label, i) => (
                  <tr key={label} className="border-t border-[#eef2f5]">
                    <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">{label}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">{dailyDesc[i] ?? "—"}</td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatDecimal(
                        num((daily?.temperature_2m_min as number[])?.[i]),
                        1,
                      )}
                      {" / "}
                      {formatDecimal(
                        num((daily?.temperature_2m_max as number[])?.[i]),
                        1,
                      )}{" "}
                      °C
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatDecimal(
                        num((daily?.precipitation_sum as number[])?.[i]),
                        1,
                      )}{" "}
                      mm
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatPercent(
                        num(
                          (daily?.precipitation_probability_max as number[])?.[
                            i
                          ],
                        ),
                      )}
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatDecimal(
                        num((daily?.wind_speed_10m_max as number[])?.[i]),
                        0,
                      )}{" "}
                      km/h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : loading ? (
        <LoadingBlock label={t("Caricamento previsioni Open-Meteo…")} />
      ) : null}

      <p className="mt-2 text-[11px] text-[#5b6f82] sm:text-xs">
        Fonti:{" "}
        <a
          href="https://rischi.protezionecivile.gov.it/it/meteo-idro/allertamento/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Protezione Civile
        </a>
        {" / "}
        <a
          href="https://www.regione.toscana.it/allertameteo"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Allerta Toscana
        </a>{" "}
        (allerte) ·{" "}
        <a
          href="https://openweathermap.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OpenWeather
        </a>{" "}
        (condizioni, previsione 5 giorni, qualità aria) ·{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">
          Open-Meteo
        </a>{" "}
        (grafici orari/giornalieri) ·{" "}
        <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer" className="underline">
          RainViewer
        </a>{" "}
        (radar). Condizioni puntuali anche da ItaliaMeteo/Cineca via Cruscotto Italia.
      </p>
    </section>
  );
}
