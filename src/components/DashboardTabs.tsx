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
} from "lucide-react";
import { BarChart, DoughnutChart, LineChart } from "@/components/Charts";
import {
  DataUnavailable,
  KpiCard,
  LoadingBlock,
  SectionIntro,
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

const MapPanel = dynamic(() => import("@/components/MapPanel"), {
  ssr: false,
  loading: () => <LoadingBlock label="Caricamento mappa…" />,
});

const Terrain3D = dynamic(() => import("@/components/Terrain3D"), {
  ssr: false,
  loading: () => <LoadingBlock label="Caricamento rilievo 3D…" />,
});

const MeteoRadarMap = dynamic(() => import("@/components/MeteoRadarMap"), {
  ssr: false,
  loading: () => <LoadingBlock label="Caricamento radar…" />,
});

const VesselFinderEmbed = dynamic(
  () =>
    import("@/components/PortoExtras").then((m) => m.VesselFinderEmbed),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento mappa AIS…" />,
  },
);

const PortoWebcams = dynamic(
  () => import("@/components/PortoExtras").then((m) => m.PortoWebcams),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento webcam…" />,
  },
);

const PunIdrMap = dynamic(
  () => import("@/components/InfraExtras").then((m) => m.PunIdrMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento mappa colonnine…" />,
  },
);

const BandaUltralargaMap = dynamic(
  () => import("@/components/InfraExtras").then((m) => m.BandaUltralargaMap),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Caricamento mappa fibra…" />,
  },
);

type Kpi = Record<string, unknown>;

const TABS = [
  { id: "panoramica", label: "Panoramica", Icon: Globe2 },
  { id: "turismo", label: "Turismo", Icon: Palmtree },
  { id: "porto", label: "Porto", Icon: Ship },
  { id: "economia", label: "Economia", Icon: Factory },
  { id: "finanza", label: "Finanza", Icon: Landmark },
  { id: "territorio", label: "Territorio", Icon: Mountain },
  { id: "ambiente", label: "Ambiente", Icon: Waves },
  { id: "infra", label: "Mobilità", Icon: Train },
  { id: "sanita", label: "Sanità", Icon: Stethoscope },
  { id: "meteo", label: "Meteo", Icon: CloudSun },
  { id: "mappa", label: "Mappa", Icon: Map },
] as const;

type TabId = (typeof TABS)[number]["id"];

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

export function DashboardTabs({ kpi }: { kpi: Kpi }) {
  const [tab, setTab] = useState<TabId>("panoramica");

  return (
    <div>
      <nav
        className="sticky top-0 z-20 border-b border-[#d9e6f2] bg-white/95 backdrop-blur"
        aria-label="Sezioni del cruscotto"
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-4">
          <ul
            className="m-0 flex list-none gap-1 overflow-x-auto p-0 py-2 sm:gap-1.5 sm:py-1.5"
            role="tablist"
            style={{ scrollbarWidth: 'thin' }}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              const Icon = t.Icon;
              return (
                <li key={t.id} role="presentation" className="flex-shrink-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:gap-2 sm:px-4 ${
                      active
                        ? "bg-[#0066CC] text-white"
                        : "bg-transparent text-[#17324d] hover:bg-[#e8f2fc]"
                    }`}
                    onClick={() => setTab(t.id)}
                  >
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    <span>{t.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6" role="tabpanel">
        {tab === "panoramica" && <Panoramica kpi={kpi} />}
        {tab === "turismo" && <Turismo kpi={kpi} />}
        {tab === "porto" && <Porto kpi={kpi} />}
        {tab === "economia" && <Economia kpi={kpi} />}
        {tab === "finanza" && <Finanza kpi={kpi} />}
        {tab === "territorio" && <Territorio kpi={kpi} />}
        {tab === "ambiente" && <Ambiente kpi={kpi} />}
        {tab === "infra" && <Infra kpi={kpi} />}
        {tab === "sanita" && <Sanita kpi={kpi} />}
        {tab === "meteo" && <Meteo kpi={kpi} />}
        {tab === "mappa" && <MapPanel kpi={kpi} />}
      </div>
    </div>
  );
}

function Panoramica({ kpi }: { kpi: Kpi }) {
  const { detail, loading } = useDettaglio(
    "demografia,profilo,censimento,scuole,redditi,patrimonio",
  );
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

  const demoExt = asRecord(detail?.demografia);
  const fasce = asRecord(demoExt?.fasce_eta);
  const profilo = asRecord(detail?.profilo);
  const cens = asRecord(asRecord(detail?.censimento)?.kpi_comune);
  const scuole = asRecord(detail?.scuole);
  const piramideFasce = Array.isArray(demoExt?.piramide_fasce)
    ? (demoExt.piramide_fasce as Array<{ label: string; m: number; f: number; tot: number }>)
    : [];

  return (
    <section>
      <SectionIntro
        title="Panoramica"
        description={`Cruscotto completo di ${String(anagrafica?.nome ?? "San Vincenzo")} — KPI sintetici e approfondimenti demografici.`}
      />

      <div className="mb-4 grid gap-2.5 sm:mb-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard 
          label="Popolazione" 
          value={valueOrMissing(demo?.popolazione, formatInteger)} 
          hint={String(demo?.riferimento ?? "")}
          icon={Users}
          variant="info"
        />
        <KpiCard 
          label="Maschi / Femmine" 
          value={`${formatInteger(num(demo?.maschi))} / ${formatInteger(num(demo?.femmine))}`}
          icon={Users}
        />
        <KpiCard 
          label="Età media" 
          value={valueOrMissing(demo?.eta_media, (v) => formatDecimal(v, 1))}
          icon={Users}
        />
        <KpiCard 
          label="Indice di vecchiaia" 
          value={valueOrMissing(demo?.indice_vecchiaia, (v) => formatDecimal(v, 1))}
          icon={TrendingUp}
        />
        <KpiCard label="Indice di dipendenza" value={valueOrMissing(demo?.indice_dipendenza, (v) => formatDecimal(v, 1))} />
        <KpiCard 
          label="Tasso occupazione" 
          value={valueOrMissing(lavoro?.tasso_occupazione, formatPercent)} 
          hint={lavoro?.anno ? `Anno ${lavoro.anno}` : undefined}
          icon={Briefcase}
          variant="success"
        />
        <KpiCard 
          label="Tasso disoccupazione" 
          value={valueOrMissing(lavoro?.tasso_disoccupazione, formatPercent)}
          icon={Briefcase}
        />
        <KpiCard 
          label="Diploma o oltre" 
          value={valueOrMissing(istruzione?.pct_diploma_oltre, formatPercent)}
          icon={GraduationCap}
        />
        <KpiCard 
          label="Terziario" 
          value={valueOrMissing(istruzione?.pct_terziario, formatPercent)}
          icon={GraduationCap}
        />
        <KpiCard 
          label="Reddito medio" 
          value={valueOrMissing(redditi?.reddito_medio_eur, formatEuro)} 
          hint={`${formatInteger(num(redditi?.n_contribuenti))} contribuenti`}
          icon={Euro}
          variant="success"
        />
        <KpiCard 
          label="Indice turisticità" 
          value={valueOrMissing(turismo?.indice_turisticita_per_100ab, (v) => `${formatDecimal(v, 1)} /100 ab.`)} 
          hint={`${formatInteger(num(turismo?.totale_strutture))} strutture · ${formatInteger(num(turismo?.totale_letti))} letti`}
          icon={Palmtree}
          variant="success"
        />
        <KpiCard 
          label="Raccolta differenziata" 
          value={valueOrMissing(ambiente?.raccolta_differenziata_pct, formatPercent)}
          icon={Recycle}
          variant="success"
        />
        <KpiCard 
          label="Consumo di suolo" 
          value={valueOrMissing(ambiente?.consumo_suolo_pct, formatPercent)} 
          hint={`${formatDecimal(num(ambiente?.superficie_kmq), 2)} km²`}
          icon={LandPlot}
          variant="warning"
        />
        <KpiCard label="Copertura FTTH" value={valueOrMissing(banda?.copertura_ftth_pct, formatPercent)} />
        <KpiCard label="Punti ricarica EV" value={valueOrMissing(ev?.n_totale, formatInteger)} hint={`${formatPercent(num(ev?.pct_attivi))} attivi`} />
        <KpiCard 
          label="Veicoli" 
          value={valueOrMissing(veicoli?.totale_veicoli, formatInteger)} 
          hint={`${formatDecimal(num(veicoli?.tasso_motorizzazione_per_1000_ab), 0)} /1000 ab.`}
          icon={Car}
        />
        <KpiCard 
          label="Unità locali ASIA" 
          value={valueOrMissing(imprese?.ul_totali, formatInteger)} 
          hint={`${formatDecimal(num(imprese?.addetti_totali), 0)} addetti`}
          icon={Building2}
          trend={
            num(imprese?.ul_yoy_pct) != null 
              ? (num(imprese?.ul_yoy_pct) ?? 0) > 0 
                ? "up" 
                : (num(imprese?.ul_yoy_pct) ?? 0) < 0 
                  ? "down" 
                  : undefined
              : undefined
          }
          trendValue={imprese?.ul_yoy_pct != null ? formatPercent(num(imprese?.ul_yoy_pct)) : undefined}
        />
        <KpiCard label="Saldo cassa SIOPE" value={valueOrMissing(siope?.saldo_cassa_eur, formatEuroCompact)} hint={`Anno ${String(siope?.anno ?? "")}`} />
        <KpiCard label="PNRR" value={valueOrMissing(pnrr?.importo_assegnato_eur, formatEuroCompact)} hint={`${formatInteger(num(pnrr?.n_progetti))} progetti · ${formatInteger(num(pnrr?.n_concluso))} conclusi`} />
        <KpiCard label="Opere BDAP" value={valueOrMissing(opere?.n_progetti, formatInteger)} hint={valueOrMissing(opere?.importo_totale_eur, formatEuroCompact)} />
        <KpiCard label="Contratti ANAC" value={valueOrMissing(anac?.n_aggiudicazioni, formatInteger)} hint={valueOrMissing(anac?.importo_totale_eur, formatEuroCompact)} />
        <KpiCard 
          label="Patrimonio PA" 
          value={valueOrMissing(patrimonio?.n_immobili, formatInteger)} 
          hint={`${formatInteger(num(patrimonio?.n_fabbricati))} fabbricati · ${formatInteger(num(patrimonio?.n_terreni))} terreni`}
          icon={Building2}
        />
        <KpiCard label="Enti RUNTS" value={valueOrMissing(runts?.n_enti_totali, formatInteger)} />
        <KpiCard 
          label="Farmacie" 
          value={valueOrMissing(sanita?.n_farmacie, formatInteger)} 
          hint={`${formatInteger(num(sanita?.n_parafarmacie))} parafarmacie`}
          icon={Heart}
          variant="info"
        />
        <KpiCard label="Civici ANNCSU" value={valueOrMissing(civici?.n_civici, formatInteger)} hint={`${formatInteger(num(civici?.n_strade))} strade`} />
        <KpiCard label="Impianti carburanti" value={valueOrMissing(carburanti?.n_impianti, formatInteger)} hint={`Benzina self ${formatDecimal(num(carburanti?.prezzo_medio_benzina_self), 3)} €/L`} />
        <KpiCard label="Pendolarismo netto" value={valueOrMissing(pendol?.saldo_netto, formatInteger)} hint={`Uscenti ${formatInteger(num(pendol?.uscenti_totali))} · Entranti ${formatInteger(num(pendol?.entranti_totali))}`} />
        <KpiCard label="Elevazione media" value={valueOrMissing(morfo?.elev_mean, (v) => `${formatInteger(v)} m`)} hint={`min ${formatInteger(num(morfo?.elev_min))} · max ${formatInteger(num(morfo?.elev_max))}`} />
        <KpiCard label="CF / Catastale" value={`${String(anagrafica?.codice_fiscale ?? "n.d.")}`} hint={`Catastale ${String(anagrafica?.codice_catastale ?? "")}`} />
      </div>

      {loading ? <LoadingBlock label="Caricamento approfondimenti demografici…" /> : null}

      {fasce ? (
        <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="panel">
            <h3>Fasce d&apos;età</h3>
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
              <h3>Piramide per età (fasce quinquennali)</h3>
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

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        {cens ? (
          <div className="panel">
            <h3>Censimento (sezioni)</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li>Sezioni: {formatInteger(num(cens.n_sezioni))}</li>
              <li>Famiglie: {formatInteger(num(cens.famiglie_totali))}</li>
              <li>Abitazioni: {formatInteger(num(cens.abitazioni_totali))} ({formatInteger(num(cens.abitazioni_occupate))} occupate, {formatInteger(num(cens.abitazioni_vuote))} vuote)</li>
              <li>Stranieri: {formatInteger(num(cens.stranieri_totali))}</li>
            </ul>
          </div>
        ) : null}
        {asRecord(profilo?.cittadinanza) || asRecord(profilo?.famiglie) ? (
          <div className="panel">
            <h3>Famiglie e cittadinanza</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li>Famiglie: {formatInteger(num(asRecord(profilo?.famiglie)?.n_famiglie))} (dim. media {formatDecimal(num(asRecord(profilo?.famiglie)?.dim_media_famiglia), 1)})</li>
              <li>Italiani: {formatInteger(num(asRecord(profilo?.cittadinanza)?.italiani_n))}</li>
              <li>Stranieri: {formatInteger(num(asRecord(profilo?.cittadinanza)?.stranieri_n))} ({formatPercent(num(asRecord(profilo?.cittadinanza)?.stranieri_pct))})</li>
            </ul>
          </div>
        ) : null}
        {scuole ? (
          <div className="panel">
            <h3>Scuole MIUR {String(scuole.anno_scolastico ?? "")}</h3>
            <p className="text-xs text-[#5b6f82] sm:text-sm">
              {formatInteger(num(asRecord(scuole.kpi)?.n_scuole))} plessi
            </p>
            <ul className="mt-2 space-y-1 text-xs sm:text-sm">
              {(Array.isArray(scuole.scuole) ? (scuole.scuole as Array<Record<string, unknown>>) : []).map((s) => (
                <li key={String(s.codice_scuola)}>
                  <strong>{String(s.denominazione)}</strong> — {String(s.tipologia)}
                  <br />
                  <span className="text-[#5b6f82]">{String(s.indirizzo)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Turismo({ kpi }: { kpi: Kpi }) {
  const { detail, error, loading } = useDettaglio("turismo");
  const [porti, setPorti] = useState<Record<string, unknown> | null>(null);
  const [eventi, setEventi] = useState<Record<string, unknown> | null>(null);
  const [cultura, setCultura] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/toscana/porti").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/toscana/eventi").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/cultura/luoghi").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([p, e, c]) => {
        if (!cancelled) {
          setPorti(p);
          setEventi(e);
          setCultura(c);
        }
      })
      .catch((err) => console.error("Errore caricamento dati turismo extra:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const turismoKpi = asRecord(kpi.turismo);
  const turismo = asRecord(detail?.turismo);
  const capacita = asRecord(turismo?.capacita_comune);
  const alberghi = asRecord(capacita?.alberghi);
  const extra = asRecord(capacita?.extra_alberghiero);
  const flussi = asRecord(turismo?.flussi_provincia);
  
  const portualita = asRecord(porti?.portualita);
  const luoghiCultura = Array.isArray(cultura?.luoghi)
    ? (cultura.luoghi as Array<Record<string, unknown>>)
    : [];

  const stelleLabels = ["5", "4", "3", "2", "1"];
  const stelleData = stelleLabels.map((s) => num(asRecord(alberghi?.[`stelle_${s}`])?.strutture) ?? 0);
  const stelleLetti = stelleLabels.map((s) => num(asRecord(alberghi?.[`stelle_${s}`])?.letti) ?? 0);

  return (
    <section>
      <SectionIntro
        title="Turismo"
        description="Capacità ricettiva comunale e flussi provinciali ISTAT. La tassa di soggiorno non è inclusa nelle fonti Cruscotto Italia."
      />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Strutture" value={valueOrMissing(capacita?.totale_strutture ?? turismoKpi?.totale_strutture, formatInteger)} />
        <KpiCard label="Letti" value={valueOrMissing(capacita?.totale_letti ?? turismoKpi?.totale_letti, formatInteger)} />
        <KpiCard label="Camere" value={valueOrMissing(capacita?.totale_camere, formatInteger)} />
        <KpiCard label="Indice turisticità" value={valueOrMissing(capacita?.indice_turisticita_per_100ab ?? turismoKpi?.indice_turisticita_per_100ab, (v) => `${formatDecimal(v, 1)} /100 ab.`)} />
      </div>

      {loading ? <LoadingBlock /> : null}
      {error ? <DataUnavailable message={error} /> : null}

      {capacita ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="panel">
            <h3>Alberghiero — strutture per stelle</h3>
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
            <h3>Extra-alberghiero</h3>
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
          <h3>Flussi provinciali (Livorno) — anno {String(flussi.anno)}</h3>
          {flussi._warning ? <p className="text-sm text-[#5b6f82]">{String(flussi._warning)}</p> : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Arrivi totali" value={formatInteger(num(flussi.arrivi_totali))} />
            <KpiCard label="Presenze totali" value={formatInteger(num(flussi.presenze_totali))} />
            <KpiCard label="Permanenza media" value={`${formatDecimal(num(flussi.permanenza_media), 1)} gg`} />
            <KpiCard label="Quota stranieri" value={formatPercent(num(flussi.stranieri_pct))} />
          </div>
            <p className="mb-0 mt-2.5 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
              Arrivi IT {formatInteger(num(flussi.arrivi_italiani))} / EST {formatInteger(num(flussi.arrivi_stranieri))} ·
              Presenze IT {formatInteger(num(flussi.presenze_italiane))} / EST {formatInteger(num(flussi.presenze_straniere))}
            </p>
        </div>
      ) : null}

      {portualita ? (
        <div className="mt-4 panel bg-[#e8f4ff]">
          <h3>Porto turistico</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Posti barca"
              value={valueOrMissing(portualita.posti_barca, formatInteger)}
              icon={Ship}
              variant="info"
            />
            <KpiCard
              label="Tipo struttura"
              value={String(portualita.tipo ?? "n.d.")}
              icon={Ship}
            />
            <KpiCard
              label="Classificazione"
              value={String(porti?.classificazione ?? "n.d.")}
              icon={Ship}
            />
          </div>
          {Array.isArray(porti?.servizi) ? (
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold sm:text-sm">
                Servizi disponibili:
              </p>
              <ul className="flex flex-wrap gap-2">
                {(porti.servizi as string[]).map((s) => (
                  <li
                    key={s}
                    className="rounded bg-white px-2 py-1 text-xs font-medium"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mb-0 mt-2.5 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
            Fonte: Regione Toscana - Masterplan portualità turistica
          </p>
        </div>
      ) : null}

      {luoghiCultura.length > 0 ? (
        <div className="mt-4 panel">
          <h3>Luoghi di interesse culturale</h3>
          <ul className="space-y-2 text-xs sm:text-sm">
            {luoghiCultura.map((luogo) => (
              <li key={String(luogo.nome)} className="border-b border-[#eef2f5] pb-2 last:border-0">
                <strong className="text-sm sm:text-base">{String(luogo.nome)}</strong>
                <br />
                <span className="text-[#5b6f82]">
                  {String(luogo.tipologia)} • {String(luogo.tipo)}
                  {luogo.visitabile === true ? " • Visitabile" : ""}
                </span>
                {luogo.note ? (
                  <>
                    <br />
                    <span className="text-xs text-[#5b6f82]">{String(luogo.note)}</span>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mb-0 mt-2.5 text-xs text-[#5b6f82] sm:mt-3 sm:text-sm">
            Fonte: Ministero della Cultura - Catalogo generale beni culturali
          </p>
        </div>
      ) : null}

      {eventi?.disponibile === true ? (
        <div className="mt-4 panel bg-[#fff4e6]">
          <h3>Eventi culturali Regione Toscana</h3>
          <p className="mb-2 text-xs sm:text-sm">
            {String(eventi.note ?? "Eventi promossi dalla Regione Toscana")}
          </p>
          {Array.isArray(eventi.categorie) ? (
            <ul className="flex flex-wrap gap-2">
              {(eventi.categorie as string[]).map((cat) => (
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
            Fonte:{" "}
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
      ) : null}

      <p className="mt-3 text-xs text-[#5b6f82] sm:mt-4 sm:text-sm">
        Nota: la tassa/imposta di soggiorno non è disponibile in queste fonti.
      </p>
    </section>
  );
}

function Porto({ kpi }: { kpi: Kpi }) {
  const [porti, setPorti] = useState<Record<string, unknown> | null>(null);
  const [balneazione, setBalneazione] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const carburanti = asRecord(kpi.carburanti_mimit);
  const ev = asRecord(kpi.ricarica_ev_pun);
  const meteo = asRecord(kpi.meteo_italiameteo);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/toscana/porti").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/arpat/balneazione").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([p, b]) => {
        if (cancelled) return;
        setPorti(p);
        setBalneazione(b);
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
        title="Porto"
        description="Dati aggregati sul porto turistico: posti barca, servizi, webcam ufficiali del Comune e traffico AIS via VesselFinder."
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label="Posti barca"
          value={valueOrMissing(
            portualita?.posti_barca ?? ormeggio?.posti_barca,
            formatInteger,
          )}
          hint={String(portualita?.tipo ?? "")}
          icon={Ship}
          variant="info"
        />
        <KpiCard
          label="Classificazione"
          value={String(porti?.classificazione ?? "n.d.")}
        />
        <KpiCard
          label="Punti ricarica EV (comune)"
          value={valueOrMissing(ev?.n_totale, formatInteger)}
          hint={`${formatInteger(num(ev?.n_attivi))} attivi`}
          icon={Car}
        />
        <KpiCard
          label="Impianti carburanti"
          value={valueOrMissing(carburanti?.n_impianti, formatInteger)}
          hint={
            carburanti?.prezzo_medio_benzina_self != null
              ? `Benzina self ${formatDecimal(num(carburanti.prezzo_medio_benzina_self), 3)} €/L`
              : undefined
          }
        />
        <KpiCard
          label="Vento (live)"
          value={valueOrMissing(meteo?.vento_kmh, (v) =>
            `${formatDecimal(v, 1)} km/h`,
          )}
          hint={meteo?.ww_desc ? String(meteo.ww_desc) : undefined}
          icon={Wind}
        />
        <KpiCard
          label="Balneazione eccellente"
          value={valueOrMissing(
            balneazione?.classificazione_eccellente_pct,
            formatPercent,
          )}
          hint={
            balneazione?.aree_totali != null
              ? `${formatInteger(num(balneazione.aree_totali))} aree ARPAT`
              : undefined
          }
          icon={Waves}
          variant="success"
        />
        <KpiCard
          label="Posti barca in Toscana"
          value={valueOrMissing(contesto?.totale_posti_barca, formatInteger)}
          hint="Contesto regionale"
        />
        <KpiCard
          label="Coordinate porto"
          value={
            portualita?.lat != null && portualita?.lon != null
              ? `${formatDecimal(num(portualita.lat), 4)}, ${formatDecimal(num(portualita.lon), 4)}`
              : "n.d."
          }
        />
      </div>

      {loading ? <LoadingBlock label="Caricamento dati porto…" /> : null}

      {portualita?.descrizione ? (
        <div className="mb-4 panel">
          <h3>Scheda porto</h3>
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
  const { detail, loading } = useDettaglio("asia,redditi,profilo,scuole");
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
  const istruzione = asRecord(asRecord(detail?.profilo)?.istruzione);
  const dettaglioIstr = asRecord(istruzione?.dettaglio);
  const lavoroExt = asRecord(asRecord(detail?.profilo)?.lavoro);

  const fasceEntries = fasce
    ? Object.values(fasce)
        .map((v) => asRecord(v))
        .filter((v): v is Record<string, unknown> => Boolean(v && v.label))
    : [];

  return (
    <section>
      <SectionIntro title="Economia & Lavoro" description="Redditi MEF (serie e fasce), profilo occupazionale/istruzione ISTAT e imprese ASIA con ATECO." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Tasso occupazione" value={valueOrMissing(lavoro?.tasso_occupazione, formatPercent)} hint={lavoroExt ? `${formatInteger(num(lavoroExt.occupati_n))} occupati` : undefined} />
        <KpiCard label="Tasso disoccupazione" value={valueOrMissing(lavoro?.tasso_disoccupazione, formatPercent)} hint={lavoroExt ? `${formatInteger(num(lavoroExt.in_cerca_n))} in cerca` : undefined} />
        <KpiCard label="Tasso di attività" value={valueOrMissing(lavoro?.tasso_attivita, formatPercent)} />
        <KpiCard label="Reddito medio" value={valueOrMissing(redditiKpi?.reddito_medio_eur, formatEuro)} hint={`Imposta media ${formatEuro(num(redditiKpi?.imposta_netta_media_eur))}`} />
        <KpiCard label="Unità locali" value={valueOrMissing(imprese?.ul_totali, formatInteger)} hint={imprese?.ul_yoy_pct != null ? `YoY ${formatPercent(num(imprese.ul_yoy_pct))}` : undefined} />
        <KpiCard label="Addetti totali" value={valueOrMissing(imprese?.addetti_totali, (v) => formatDecimal(v, 0))} hint={`Addetti/UL ${formatDecimal(num(imprese?.addetti_per_ul), 2)}`} />
        <KpiCard label="UL per 1000 ab." value={valueOrMissing(imprese?.ul_per_1000_ab, (v) => formatDecimal(v, 1))} />
        <KpiCard label="Contribuenti" value={valueOrMissing(redditiKpi?.n_contribuenti, formatInteger)} hint={redditiKpi?.anno_fiscale ? `Anno fiscale ${redditiKpi.anno_fiscale}` : undefined} />
      </div>

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {trend.length > 0 ? (
          <div className="panel">
            <h3>Trend reddito medio MEF</h3>
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
            <h3>Distribuzione contribuenti per fascia di reddito</h3>
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
            <h3>Serie storica unità locali ASIA</h3>
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
            <h3>Mix classe addetti (UL %)</h3>
            <DoughnutChart
              labels={["0–9", "10–49", "50–249"]}
              values={[num(mixAddetti.W0_9) ?? 0, num(mixAddetti.W10_49) ?? 0, num(mixAddetti.W50_249) ?? 0]}
            />
          </div>
        ) : null}
      </div>

      {topSettori.length > 0 ? (
        <div className="mb-4 panel">
          <h3>Top settori ASIA (unità locali)</h3>
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
          <h3>Top codici ATECO</h3>
          <BarChart labels={topAteco.map((s) => s.code)} datasets={[{ label: "UL", data: topAteco.map((s) => s.ul) }]} />
        </div>
      ) : null}

      {dettaglioIstr ? (
        <div className="panel">
          <h3>Titolo di studio (pop. 25–64)</h3>
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
    </section>
  );
}

function Finanza({ kpi }: { kpi: Kpi }) {
  const { detail, loading } = useDettaglio("siope,anac,bdap,pnrr,patrimonio");
  const siopeKpi = asRecord(kpi.siope);
  const anacKpi = asRecord(kpi.contratti_anac);
  const opereKpi = asRecord(kpi.opere_bdap);
  const pnrrKpi = asRecord(kpi.pnrr);

  const siope = asRecord(detail?.siope);
  const anac = asRecord(detail?.anac);
  const bdap = asRecord(detail?.bdap_kpi);
  const pnrr = asRecord(detail?.pnrr);
  const patrimonio = asRecord(detail?.immobili_pa);
  const topCpv = Array.isArray(anac?.top_cpv)
    ? (anac.top_cpv as Array<{ desc?: string; code?: string; importo?: number; count?: number }>)
    : [];
  const topSettori = Array.isArray(bdap?.top_settori)
    ? (bdap.top_settori as Array<{ settore?: string; count?: number; costo?: number }>)
    : [];
  const missioni = Array.isArray(pnrr?.per_missione)
    ? (pnrr.per_missione as Array<{ missione?: string; descrizione?: string; tot_pnrr?: number; n_progetti?: number }>)
    : [];
  const progettiPnrr = Array.isArray(pnrr?.progetti)
    ? (pnrr.progetti as Array<Record<string, unknown>>)
    : [];
  const progettiOpere = Array.isArray(asRecord(detail?.opere)?.progetti)
    ? (asRecord(detail?.opere)?.progetti as Array<Record<string, unknown>>)
    : [];
  const mixPat = asRecord(asRecord(patrimonio?.kpi)?.mix_categoria);

  return (
    <section>
      <SectionIntro title="Finanza pubblica" description="SIOPE mensile, contratti ANAC, opere BDAP, PNRR e patrimonio immobiliare PA." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Uscite SIOPE" value={valueOrMissing(siopeKpi?.totale_uscite_eur, formatEuroCompact)} hint={`${formatEuro(num(siopeKpi?.uscite_per_abitante_eur))} /ab.`} />
        <KpiCard label="Incassi SIOPE" value={valueOrMissing(siopeKpi?.totale_incassi_eur, formatEuroCompact)} hint={`${formatEuro(num(siopeKpi?.incassi_per_abitante_eur))} /ab.`} />
        <KpiCard label="Saldo cassa" value={valueOrMissing(siopeKpi?.saldo_cassa_eur, formatEuroCompact)} />
        <KpiCard label="Contratti ANAC" value={valueOrMissing(anacKpi?.n_aggiudicazioni, formatInteger)} hint={valueOrMissing(anacKpi?.importo_totale_eur, formatEuroCompact)} />
        <KpiCard label="Opere BDAP" value={valueOrMissing(opereKpi?.n_progetti, formatInteger)} hint={valueOrMissing(opereKpi?.importo_totale_eur, formatEuroCompact)} />
        <KpiCard label="PNRR assegnato" value={valueOrMissing(pnrrKpi?.importo_assegnato_eur, formatEuroCompact)} hint={`${formatInteger(num(pnrrKpi?.n_concluso))} conclusi / ${formatInteger(num(pnrrKpi?.n_in_corso))} in corso`} />
        <KpiCard label="Immobili PA" value={valueOrMissing(asRecord(patrimonio?.kpi)?.n_totale ?? asRecord(kpi.patrimonio_pa)?.n_immobili, formatInteger)} />
        <KpiCard label="Superficie PA" value={valueOrMissing(asRecord(patrimonio?.kpi)?.superficie_totale_mq ?? asRecord(kpi.patrimonio_pa)?.superficie_totale_mq, (v) => `${formatInteger(v)} m²`)} />
      </div>

      {loading ? <LoadingBlock /> : null}

      {siope?.disponibile ? (
        <div className="mb-4 panel">
          <h3>SIOPE mensile {String(siope.anno)}{siope.parziale ? " (parziale)" : ""}</h3>
          <LineChart
            labels={(siope.labels as string[]) ?? []}
            datasets={[
              { label: "Uscite", data: (siope.uscite_mensili as number[]) ?? [], color: "#D9364F" },
              { label: "Entrate", data: (siope.entrate_mensili as number[]) ?? [], color: "#008758" },
            ]}
          />
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {topCpv.length > 0 ? (
          <div className="panel">
            <h3>Top CPV ANAC</h3>
            <BarChart
              labels={topCpv.map((c) => String(c.desc ?? c.code ?? "").slice(0, 40))}
              datasets={[{ label: "Importo €", data: topCpv.map((c) => c.importo ?? 0), color: "#0066CC" }]}
            />
          </div>
        ) : null}
        {topSettori.length > 0 ? (
          <div className="panel">
            <h3>Opere BDAP per settore</h3>
            <BarChart
              labels={topSettori.map((s) => String(s.settore ?? "").slice(0, 36))}
              datasets={[{ label: "Costo €", data: topSettori.map((s) => s.costo ?? 0), color: "#CC7A00" }]}
            />
          </div>
        ) : null}
      </div>

      {missioni.length > 0 ? (
        <div className="mb-4 panel">
          <h3>PNRR per missione</h3>
          <ul className="space-y-2 text-xs sm:text-sm">
            {missioni.map((m) => (
              <li key={String(m.missione)}>
                <strong>{m.missione} — {m.descrizione}</strong>: {formatInteger(num(m.n_progetti))} progetti · {formatEuroCompact(num(m.tot_pnrr))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {progettiPnrr.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel p-0">
          <h3 className="px-3 pt-3 sm:px-4 sm:pt-4">Progetti PNRR</h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Titolo</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Stato</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Finanziamento</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Fine</th>
              </tr>
            </thead>
            <tbody>
              {progettiPnrr.map((p) => (
                <tr key={String(p.cup)} className="border-t border-[#eef2f5]">
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.titolo)}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.stato_avanzamento ?? "—")}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{formatEuroCompact(num(p.finanziamento_pnrr))}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.data_fine_effettiva ?? p.data_fine_prevista ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {progettiOpere.length > 0 ? (
        <div className="mb-4 overflow-x-auto panel p-0">
          <h3 className="px-3 pt-3 sm:px-4 sm:pt-4">Opere BDAP (campione)</h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Descrizione</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Settore</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Stato</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Costo prev.</th>
              </tr>
            </thead>
            <tbody>
              {progettiOpere.slice(0, 20).map((p) => (
                <tr key={String(p.cup)} className="border-t border-[#eef2f5]">
                  <td className="max-w-md px-2 py-1.5 sm:px-3 sm:py-2">{String(p.descrizione)}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.settore ?? "—")}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{String(p.stato ?? "—")}</td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">{formatEuroCompact(num(p.costo_prev))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {mixPat ? (
        <div className="panel">
          <h3>Patrimonio PA — mix categorie</h3>
          <BarChart
            labels={Object.keys(mixPat).map((k) => k.replace(/_/g, " "))}
            datasets={[{ label: "N. immobili", data: Object.values(mixPat).map((v) => Number(v) || 0) }]}
          />
        </div>
      ) : null}
    </section>
  );
}

function Territorio({ kpi }: { kpi: Kpi }) {
  const { detail, loading } = useDettaglio("territorio,morfologia,censimento");
  const ambiente = asRecord(kpi.ambiente);
  const aria = asRecord(kpi.aria_ispra);
  const morfoKpi = asRecord(kpi.morfologia_cnr);

  const territorio = asRecord(detail?.territorio);
  const rifiuti = asRecord(territorio?.rifiuti);
  const serieRifiuti = Array.isArray(rifiuti?.serie_storica)
    ? (rifiuti.serie_storica as Array<{ anno?: number; rd_pct?: number; kg_ab?: number }>)
    : [];
  const suolo = asRecord(territorio?.suolo);
  const serieSuolo = Array.isArray(suolo?.serie_storica)
    ? (suolo.serie_storica as Array<{ intervallo?: string; netto_ha?: number }>)
    : [];
  const alluvioni = asRecord(asRecord(territorio?.rischio_idrogeologico)?.alluvioni);
  const frane = asRecord(asRecord(territorio?.rischio_idrogeologico)?.frane);
  const morfo = asRecord(asRecord(detail?.morfologia)?.stats) ?? morfoKpi;
  const aspect = asRecord(morfo?.aspect_dist);
  const geomorph = asRecord(morfo?.geomorph);
  const sismica = asRecord(territorio?.classificazione_sismica);
  const distEta = asRecord(asRecord(asRecord(detail?.censimento)?.distribuzioni_comune)?.eta_5anni);

  return (
    <section>
      <SectionIntro title="Territorio & Ambiente" description="Suolo, rifiuti, rischio idrogeologico, sismica e morfologia CNR-IRPI." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Superficie" value={valueOrMissing(ambiente?.superficie_kmq, (v) => `${formatDecimal(v, 2)} km²`)} />
        <KpiCard label="Consumo di suolo" value={valueOrMissing(ambiente?.consumo_suolo_pct, formatPercent)} hint={suolo ? `${formatDecimal(num(asRecord(suolo.stock_2024)?.ha), 1)} ha` : undefined} />
        <KpiCard label="Raccolta differenziata" value={valueOrMissing(ambiente?.raccolta_differenziata_pct, formatPercent)} />
        <KpiCard label="Rifiuti pro capite" value={valueOrMissing(ambiente?.rifiuti_kg_per_abitante, (v) => `${formatInteger(v)} kg/ab`)} />
        <KpiCard label="Zona sismica" value={sismica?.zona_sismica ? `Zona ${sismica.zona_sismica}` : "n.d."} />
        <KpiCard label="Elevazione media" value={valueOrMissing(morfo?.elev_mean, (v) => `${formatInteger(v)} m`)} hint={`min ${formatInteger(num(morfo?.elev_min))} · max ${formatInteger(num(morfo?.elev_max))}`} />
        <KpiCard label="Pendenza media" value={valueOrMissing(morfo?.slope_mean, (v) => `${formatDecimal(v, 1)}°`)} hint={`>${15}°: ${formatPercent(num(morfo?.slope_gt15_pct))}`} />
        <KpiCard label="Esposizione dominante" value={morfo?.aspect_dom ? String(morfo.aspect_dom) : "n.d."} />
      </div>

      {aria?.ha_stazione === false ? (
        <div className="mb-4"><DataUnavailable message="Qualità dell'aria ISPRA: nessuna stazione presente nel comune." /></div>
      ) : null}

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {serieRifiuti.length > 0 ? (
          <div className="panel">
            <h3>Serie raccolta differenziata</h3>
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
            <h3>Incremento netto consumo di suolo (ha)</h3>
            <BarChart
              labels={serieSuolo.map((s) => String(s.intervallo))}
              datasets={[{ label: "ha netti", data: serieSuolo.map((s) => s.netto_ha ?? 0), color: "#D9364F" }]}
            />
          </div>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {alluvioni ? (
          <div className="panel">
            <h3>Rischio alluvioni (popolazione esposta)</h3>
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
            <h3>Rischio frane</h3>
            <ul className="space-y-1 text-xs sm:text-sm">
              <li>Area P3+P4: {formatDecimal(num(frane.ar_p3p4_kmq), 2)} km² ({formatPercent(num(frane.ar_p3p4_pct))})</li>
              <li>Popolazione P3+P4: {formatInteger(num(frane.pop_p3p4))} ({formatPercent(num(frane.pop_p3p4_pct))})</li>
              <li>Edifici P3+P4: {formatInteger(num(frane.ed_p3p4))}</li>
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {aspect ? (
          <div className="panel">
            <h3>Esposizione versanti (%)</h3>
            <BarChart labels={Object.keys(aspect)} datasets={[{ label: "%", data: Object.values(aspect).map((v) => Number(v) || 0) }]} />
          </div>
        ) : null}
        {geomorph ? (
          <div className="panel">
            <h3>Geomorfologia (%)</h3>
            <BarChart labels={Object.keys(geomorph)} datasets={[{ label: "%", data: Object.values(geomorph).map((v) => Number(v) || 0), color: "#5B2C6F" }]} />
          </div>
        ) : null}
      </div>

      {distEta ? (
        <div className="mb-4 panel">
          <h3>Popolazione censimento per età (5 anni)</h3>
          <BarChart
            labels={Object.keys(distEta)}
            datasets={[{ label: "Abitanti", data: Object.values(distEta).map((v) => Number(v) || 0) }]}
          />
        </div>
      ) : null}

      {morfo ? (
        <div className="panel">
          <h3>Rilievo 3D stilizzato (morfologia)</h3>
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
  const impianti = Array.isArray(carb?.punti) ? (carb.punti as Array<Record<string, unknown>>) : [];
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
      <SectionIntro title="Infrastrutture & Mobilità" description="Banda larga, EV, veicoli, incidenti, pendolarismo e carburanti." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Copertura FTTH" value={valueOrMissing(banda?.copertura_ftth_pct ?? asRecord(agcom?.kpi)?.copertura_ftth_desi_pct, formatPercent)} hint={`FTTH 20m ${formatPercent(num(banda?.copertura_ftth_20m_pct ?? asRecord(agcom?.kpi)?.copertura_ftth_20m_pct))}`} />
        <KpiCard label="Punti ricarica EV" value={valueOrMissing(punKpi?.n_totale, formatInteger)} hint={`${formatInteger(num(punKpi?.n_attivi))} attivi · ${formatDecimal(num(punKpi?.potenza_tot_kw ?? punKpi?.potenza_totale_kw), 0)} kW`} />
        <KpiCard label="Veicoli" value={valueOrMissing(veicoli?.totale_veicoli ?? parco?.totale, formatInteger)} hint={`${formatDecimal(num(veicoli?.tasso_motorizzazione_per_1000_ab ?? parco?.tasso_motorizzazione_per_1000_ab), 0)} /1000 ab.`} />
        <KpiCard label="Pendolarismo netto" value={valueOrMissing(pend?.saldo_netto, formatInteger)} hint={`Auto-contenimento ${formatPercent(num(pend?.auto_contenimento_pct))}`} />
        <KpiCard label="% veicoli inquinanti" value={valueOrMissing(veicoli?.pct_inquinanti ?? euro?.pct_inquinanti, formatPercent)} />
        <KpiCard label="Incidenti (ultimo anno)" value={valueOrMissing(incidenti?.incidenti, formatInteger)} hint={incidenti ? `${formatInteger(num(incidenti.morti))} morti · ${formatInteger(num(incidenti.feriti))} feriti` : undefined} />
        <KpiCard label="Impianti carburanti" value={valueOrMissing(carbKpi?.n_impianti ?? asRecord(kpi.carburanti_mimit)?.n_impianti, formatInteger)} />
      </div>

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {mixPotenza ? (
          <div className="panel">
            <h3>Mix potenza punti EV</h3>
            <DoughnutChart labels={Object.keys(mixPotenza)} values={Object.values(mixPotenza).map((v) => Number(v) || 0)} />
          </div>
        ) : null}
        {iscrizioni ? (
          <div className="panel">
            <h3>Nuove iscrizioni veicoli {String(iscrizioni.anno)}</h3>
            <DoughnutChart
              labels={["Benzina", "Gasolio", "Elettriche", "Ibride", "Gas/GPL"]}
              values={[num(iscrizioni.benzina) ?? 0, num(iscrizioni.gasolio) ?? 0, num(iscrizioni.elettriche) ?? 0, num(iscrizioni.ibride) ?? 0, num(iscrizioni.gas_metano_gpl) ?? 0]}
            />
          </div>
        ) : null}
      </div>

      {euro ? (
        <div className="mb-4 panel">
          <h3>Parco veicoli per classe Euro</h3>
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
          <h3>Serie incidenti stradali</h3>
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
            <h3>Top destinazioni pendolari</h3>
            <BarChart
              labels={topDest.map((d) => COMUNI_LOOKUP[String(d.istat)] ?? String(d.istat))}
              datasets={[{ label: "Persone", data: topDest.map((d) => d.count ?? 0), color: "#0066CC" }]}
            />
          </div>
        ) : null}
        {topOrig.length > 0 ? (
          <div className="panel">
            <h3>Top origini pendolari</h3>
            <BarChart
              labels={topOrig.map((d) => COMUNI_LOOKUP[String(d.istat)] ?? String(d.istat))}
              datasets={[{ label: "Persone", data: topOrig.map((d) => d.count ?? 0), color: "#008758" }]}
            />
          </div>
        ) : null}
      </div>

      <div className="mb-4">
        <PunIdrMap />
      </div>

      <div className="mb-4">
        <BandaUltralargaMap />
      </div>

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label="Benzina self media"
          value={valueOrMissing(
            prezzoMedio?.benzina_self ??
              asRecord(kpi.carburanti_mimit)?.prezzo_medio_benzina_self,
            (v) => `${formatDecimal(v, 3)} €/L`,
          )}
          icon={Car}
        />
        <KpiCard
          label="Gasolio self media"
          value={valueOrMissing(prezzoMedio?.gasolio_self, (v) => `${formatDecimal(v, 3)} €/L`)}
          icon={Car}
        />
        <KpiCard
          label="Miglior benzina self"
          value={valueOrMissing(bestBenzina, (v) => `${formatDecimal(v, 3)} €/L`)}
          hint="Prezzo più basso nel comune"
          variant="success"
        />
        <KpiCard
          label="Miglior gasolio self"
          value={valueOrMissing(bestGasolio, (v) => `${formatDecimal(v, 3)} €/L`)}
          hint="Prezzo più basso nel comune"
          variant="success"
        />
      </div>

      {impiantiOrdinati.length > 0 ? (
        <div className="overflow-x-auto panel p-0">
          <div className="flex flex-wrap items-end justify-between gap-2 px-3 pt-3 sm:px-4 sm:pt-4">
            <div>
              <h3 className="m-0">Impianti carburanti</h3>
              <p className="mb-0 mt-1 text-xs text-[#5b6f82] sm:text-sm">
                Ordinati per benzina self crescente. Badge verde = prezzo migliore
                tra gli impianti del comune.
              </p>
            </div>
          </div>
          <table className="mt-2 min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#e8f2fc]">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Impianto</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Bandiera</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Benzina self</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Gasolio self</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Aggiornato</th>
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
    </section>
  );
}

function Sanita({ kpi }: { kpi: Kpi }) {
  const { detail, loading } = useDettaglio("sanita,runts");
  const sanita = asRecord(kpi.sanita_mds);
  const runtsKpi = asRecord(kpi.terzo_settore_runts);
  const runts = asRecord(detail?.runts);
  const enti = Array.isArray(runts?.enti)
    ? (runts.enti as Array<{ denom?: string; sez?: string; x1000?: boolean; data_iscr?: string; rapp?: string }>)
    : [];
  const mix = asRecord(asRecord(runts?.kpi)?.mix_sezione);
  const iscrizioniAnno = asRecord(asRecord(runts?.kpi)?.iscrizioni_per_anno);
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
      <SectionIntro title="Sanità & Terzo settore" description="Farmacie/parafarmacie Ministero della Salute ed enti RUNTS." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard label="Farmacie" value={valueOrMissing(sanita?.n_farmacie, formatInteger)} />
        <KpiCard label="Parafarmacie" value={valueOrMissing(sanita?.n_parafarmacie, formatInteger)} />
        <KpiCard label="Ospedali" value="dato non disponibile" unavailable={ospedali == null && sanita?.n_ospedali == null} />
        <KpiCard label="Enti RUNTS" value={valueOrMissing(runtsKpi?.n_enti_totali, formatInteger)} hint={`${formatInteger(num(runtsKpi?.n_5x1000))} iscritti al 5x1000`} />
      </div>

      {loading ? <LoadingBlock /> : null}

      <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {mix ? (
          <div className="panel">
            <h3>Mix sezioni RUNTS</h3>
            <DoughnutChart labels={Object.keys(mix)} values={Object.values(mix).map((v) => Number(v) || 0)} />
          </div>
        ) : null}
        {iscrizioniAnno ? (
          <div className="panel">
            <h3>Iscrizioni RUNTS per anno</h3>
            <BarChart
              labels={Object.keys(iscrizioniAnno)}
              datasets={[{ label: "Iscrizioni", data: Object.values(iscrizioniAnno).map((v) => Number(v) || 0) }]}
            />
          </div>
        ) : null}
      </div>

      {(farmacie.length > 0 || para.length > 0) ? (
        <div className="mb-4 panel">
          <h3>Farmacie e parafarmacie</h3>
          <ul className="space-y-2 text-xs sm:text-sm">
            {[...farmacie, ...para].map((p) => (
              <li key={String(p.nome)}>
                <strong>{String(p.nome)}</strong>
                {p.tipo ? ` (${String(p.tipo)})` : " (Parafarmacia)"}
                <br />
                <span className="text-[#5b6f82]">{String(p.indirizzo ?? "")} {String(p.cap ?? "")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {enti.length > 0 ? (
        <div className="overflow-x-auto panel p-0">
          <h3 className="px-3 pt-3 sm:px-4 sm:pt-4">Elenco enti RUNTS</h3>
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Denominazione</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Sezione</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Rappresentante</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">5x1000</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">Iscrizione</th>
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

function Ambiente({ kpi }: { kpi: Kpi }) {
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
  const aree = Array.isArray(balneazione?.aree)
    ? (balneazione.aree as Array<Record<string, unknown>>)
    : [];

  return (
    <section>
      <SectionIntro
        title="Ambiente"
        description="Qualità acque di balneazione ARPAT, qualità aria e dati ambientali. San Vincenzo è un comune costiero con particolare attenzione alla qualità delle acque marine."
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label="Aree balneazione"
          value={valueOrMissing(balneazione?.aree_totali, formatInteger)}
          hint={`${formatDecimal(num(balneazione?.km_costa_controllati), 1)} km costa`}
          icon={Waves}
          variant="info"
        />
        <KpiCard
          label="Classificazione eccellente"
          value={valueOrMissing(
            balneazione?.classificazione_eccellente_pct,
            formatPercent,
          )}
          hint={`Anno ${String(balneazione?.anno ?? "2024")}`}
          icon={Droplets}
          variant="success"
        />
        <KpiCard
          label="Superamenti limiti 2024"
          value={valueOrMissing(balneazione?.superamenti_2024, formatInteger)}
          icon={Droplets}
          variant={num(balneazione?.superamenti_2024) === 0 ? "success" : "warning"}
        />
        <KpiCard
          label="Stazione qualità aria"
          value={aria?.disponibile === false ? "Non presente" : "n.d."}
          unavailable={true}
          icon={Wind}
        />
      </div>

      {loading ? <LoadingBlock label="Caricamento dati ARPAT…" /> : null}

      {aree.length > 0 ? (
        <div className="mb-4 panel">
          <h3>Aree di balneazione controllate ARPAT</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#e8f2fc] text-[#17324d]">
                <tr>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Area</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Classificazione</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Km costa</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Campionamenti</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Superamenti</th>
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
                          area.classificazione === "Eccellente"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {String(area.classificazione)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatDecimal(num(area.km), 1)} km
                    </td>
                    <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                      {formatInteger(num(area.campionamenti_2024))}
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
            Fonte:{" "}
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

      {aria?.disponibile === false ? (
        <div className="mb-4 panel bg-[#fff8e6]">
          <h3>Qualità dell&apos;aria</h3>
          <p className="mb-2 text-xs sm:text-sm">{String(aria.messaggio)}</p>
          {Array.isArray(aria.stazioni_piu_vicine) ? (
            <>
              <p className="mb-2 text-xs font-semibold sm:text-sm">
                Stazioni più vicine:
              </p>
              <ul className="space-y-1 text-xs sm:text-sm">
                {(
                  aria.stazioni_piu_vicine as Array<Record<string, unknown>>
                ).map((s) => (
                  <li key={String(s.nome)}>
                    <strong>{String(s.nome)}</strong> — {formatInteger(num(s.distanza_km))} km
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <KpiCard
          label="Raccolta differenziata"
          value={valueOrMissing(ambiente?.raccolta_differenziata_pct, formatPercent)}
        />
        <KpiCard
          label="Consumo di suolo"
          value={valueOrMissing(ambiente?.consumo_suolo_pct, formatPercent)}
          hint={`${formatDecimal(num(ambiente?.superficie_kmq), 2)} km²`}
        />
      </div>

      <p className="mt-3 text-xs text-[#5b6f82] sm:mt-4 sm:text-sm">
        <strong>Note:</strong> ARPAT effettua monitoraggi microbiologici settimanali
        nelle aree di balneazione durante la stagione (1 aprile - 30 settembre).
        La classificazione si basa sui dati degli ultimi 4 anni. San Vincenzo mantiene
        acque di qualità eccellente su tutta la costa.
      </p>
    </section>
  );
}

function Meteo({ kpi }: { kpi: Kpi }) {
  const [live, setLive] = useState<Record<string, unknown> | null>(null);
  const [forecast, setForecast] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fallback = asRecord(kpi.meteo_italiameteo);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, fcRes] = await Promise.all([
        fetch(`/api/meteo?_=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/meteo/forecast?_=${Date.now()}`, { cache: "no-store" }),
      ]);
      if (kpiRes.ok) {
        const data = await kpiRes.json();
        setLive(asRecord(data.meteo));
      }
      if (fcRes.ok) {
        setForecast(await fcRes.json());
      } else if (!kpiRes.ok) {
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

  return (
    <section>
      <SectionIntro
        title="Meteo"
        description="Condizioni live (ItaliaMeteo/Cineca + Open-Meteo), previsioni orarie/giornaliere e radar precipitazioni RainViewer su mappa."
      />
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full bg-[#0066CC] px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 sm:text-sm"
        >
          Aggiorna ora
        </button>
        {loading ? (
          <span className="text-xs text-[#5b6f82] sm:text-sm">Aggiornamento…</span>
        ) : null}
      </div>
      {error ? <DataUnavailable message={error} /> : null}

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label="Temperatura"
          value={valueOrMissing(
            currentOm?.temperature_2m ?? stats?.t2m_c ?? stats?.temp_c,
            (v) => `${formatDecimal(v, 1)} °C`,
          )}
          hint={
            String(
              currentOm?.weather_desc ?? stats?.ww_desc ?? "",
            ) || undefined
          }
          icon={Thermometer}
          variant="info"
        />
        <KpiCard
          label="Percepita"
          value={valueOrMissing(currentOm?.apparent_temperature, (v) =>
            `${formatDecimal(v, 1)} °C`,
          )}
          icon={Thermometer}
        />
        <KpiCard
          label="Min / Max 24h (KPI)"
          value={`${valueOrMissing(stats?.t2m_min24h_c, (v) => formatDecimal(v, 1))} / ${valueOrMissing(stats?.t2m_max24h_c, (v) => formatDecimal(v, 1))} °C`}
          icon={Thermometer}
        />
        <KpiCard
          label="Umidità"
          value={valueOrMissing(
            currentOm?.relative_humidity_2m ?? stats?.umidita_pct,
            formatPercent,
          )}
          icon={Droplets}
          variant="info"
        />
        <KpiCard
          label="Vento"
          value={valueOrMissing(
            currentOm?.wind_speed_10m ?? stats?.vento_kmh,
            (v) => `${formatDecimal(v, 1)} km/h`,
          )}
          hint={
            currentOm?.wind_gusts_10m != null
              ? `Raffiche ${formatDecimal(num(currentOm.wind_gusts_10m), 1)} km/h`
              : stats?.raffica_max24h_kmh != null
                ? `Raffiche max ${formatDecimal(num(stats.raffica_max24h_kmh), 1)} km/h`
                : undefined
          }
          icon={Wind}
        />
        <KpiCard
          label="Nuvolosità"
          value={valueOrMissing(
            currentOm?.cloud_cover ?? stats?.nuvolosita_pct,
            formatPercent,
          )}
          icon={CloudRain}
        />
        <KpiCard
          label="Precipitazioni"
          value={valueOrMissing(
            currentOm?.precipitation ?? stats?.prec_24h_mm,
            (v) => `${formatDecimal(v, 1)} mm`,
          )}
          hint={stats?.prec_24h_mm != null ? "KPI: cumulate 24h se da ItaliaMeteo" : undefined}
          icon={Umbrella}
          variant={(num(currentOm?.precipitation ?? stats?.prec_24h_mm) ?? 0) > 5 ? "info" : "default"}
        />
        <KpiCard
          label="Direzione vento"
          value={
            currentOm?.wind_direction_10m != null || stats?.vento_dir_deg != null
              ? `${formatInteger(num(currentOm?.wind_direction_10m ?? stats?.vento_dir_deg))}°`
              : "n.d."
          }
          icon={Wind}
        />
      </div>

      <div className="mb-4">
        <MeteoRadarMap />
      </div>

      {hourlyLabels.length > 0 ? (
        <div className="mb-4 grid gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="panel">
            <h3>Temperatura prossime 48 ore</h3>
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
            <h3>Precipitazioni e probabilità</h3>
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
          <h3>Previsione 7 giorni</h3>
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
              <thead className="bg-[#e8f2fc] text-[#17324d]">
                <tr>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Giorno</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Condizioni</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Min/Max</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Pioggia</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Prob.</th>
                  <th className="px-2 py-1.5 sm:px-3 sm:py-2">Vento max</th>
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
        <LoadingBlock label="Caricamento previsioni Open-Meteo…" />
      ) : null}

      <p className="mt-2 text-[11px] text-[#5b6f82] sm:text-xs">
        Fonti aggiuntive:{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline">
          Open-Meteo
        </a>{" "}
        (previsioni) ·{" "}
        <a href="https://www.rainviewer.com/" target="_blank" rel="noopener noreferrer" className="underline">
          RainViewer
        </a>{" "}
        (radar). Condizioni puntuali anche da ItaliaMeteo/Cineca via Cruscotto Italia.
      </p>
    </section>
  );
}
