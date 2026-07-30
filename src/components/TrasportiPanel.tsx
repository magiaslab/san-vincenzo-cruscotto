"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bike, Bus, Footprints, Train } from "lucide-react";
import {
  CICLABILI_DATASET_URL,
  PEDONALI_DATASET_URL,
  RT_ORARITB_DATASET_URL,
} from "@/lib/constants";
import { formatDecimal, formatInteger } from "@/lib/format";
import { useT } from "@/lib/i18n";
import {
  DataUnavailable,
  KpiCard,
  LoadingBlock,
  SectionIntro,
  SolidButton,
  valueOrMissing,
} from "@/components/ui";

const TrasportiMap = dynamic(
  () => import("@/components/TrasportiMap").then((m) => m.TrasportiMap),
  { ssr: false, loading: () => <LoadingBlock label="Caricamento mappa…" /> },
);

type Stop = {
  stop_id: string;
  name?: string | null;
  lat: number;
  lon: number;
  dist_km?: number;
  routes_sample?: string[];
  departures_sample?: Array<{
    time?: string | null;
    route?: string | null;
    headsign?: string | null;
  }>;
};

type RouteRow = {
  route_id: string;
  short_name?: string;
  long_name?: string;
  type?: string | null;
};

type Departure = {
  stop_id?: string;
  time?: string | null;
  route?: string | null;
  headsign?: string | null;
};

type TrasportiPayload = {
  generated_at?: string | null;
  kpi?: Record<string, number | null>;
  bus?: {
    stops?: Stop[];
    routes?: RouteRow[];
    agency?: string;
  };
  train?: {
    stops?: Stop[];
    routes?: RouteRow[];
    departures_sample?: Departure[];
    agency?: string;
  };
  ciclabili?: {
    feature_count?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geojson?: any;
    dataset_url?: string;
  };
  pedonali?: {
    feature_count?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geojson?: any;
    dataset_url?: string;
  };
  note?: string;
  error?: string;
};

function hhmm(time: string | null | undefined): string {
  if (!time) return "—";
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const h = Number(parts[0]);
  const m = parts[1];
  if (!Number.isFinite(h)) return time.slice(0, 5);
  return `${String(h % 24).padStart(2, "0")}:${m}`;
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return (h % 24) * 60 + m;
}

export function TrasportiPanel({
  embedded = false,
}: {
  /** Se true, è una sezione dentro Mobilità (niente titolo pagina). */
  embedded?: boolean;
}) {
  const t = useT();
  const [data, setData] = useState<TrasportiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stopQuery, setStopQuery] = useState("");
  const [showBus, setShowBus] = useState(true);
  const [showTrain, setShowTrain] = useState(true);
  const [showCiclabili, setShowCiclabili] = useState(true);
  const [showPedonali, setShowPedonali] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trasporti?_=${Date.now()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as TrasportiPayload;
      if (!res.ok) throw new Error(json.error || "fetch failed");
      setData(json);
    } catch {
      setError("Impossibile caricare i dati trasporti.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const busStops = data?.bus?.stops ?? [];
  const trainStops = data?.train?.stops ?? [];
  const routes = data?.bus?.routes ?? [];
  const trainDeps = data?.train?.departures_sample ?? [];

  const filteredStops = useMemo(() => {
    const q = stopQuery.trim().toLowerCase();
    const list = !q
      ? busStops
      : busStops.filter(
          (s) =>
            (s.name ?? "").toLowerCase().includes(q) ||
            (s.routes_sample ?? []).some((r) => r.toLowerCase().includes(q)),
        );
    return list.slice(0, 40);
  }, [busStops, stopQuery]);

  const upcomingTrains = useMemo(() => {
    const now = nowMinutes();
    const ranked = trainDeps
      .map((d) => ({ d, mins: timeToMinutes(d.time) }))
      .filter((x) => x.mins != null)
      .sort((a, b) => {
        const da = ((a.mins! - now) + 24 * 60) % (24 * 60);
        const db = ((b.mins! - now) + 24 * 60) % (24 * 60);
        return da - db;
      })
      .map((x) => x.d);
    return ranked.slice(0, 16);
  }, [trainDeps]);

  return (
    <section>
      {embedded ? (
        <div className="mb-3">
          <h2 className="m-0 text-lg font-bold text-[var(--pa-ink)] sm:text-xl">
            {t("Trasporto pubblico e mobilità dolce")}
          </h2>
          <p className="mb-0 mt-1 text-sm text-[var(--pa-muted)]">
            {t(
              "Orari TPL (GTFS Regione Toscana), fermate e linee Autolinee Toscane, partenze FS da S.Vincenzo, aree ciclabili e pedonali comunali.",
            )}
          </p>
        </div>
      ) : (
        <SectionIntro
          title={t("Trasporti")}
          description={t(
            "Orari TPL (GTFS Regione Toscana), fermate e linee Autolinee Toscane, partenze FS da S.Vincenzo, aree ciclabili e pedonali comunali.",
          )}
        />
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <SolidButton onClick={() => void load()}>{t("Aggiorna ora")}</SolidButton>
        {loading ? (
          <span className="text-xs text-[var(--pa-muted)] sm:text-sm">
            {t("Aggiornamento…")}
          </span>
        ) : null}
        {data?.generated_at ? (
          <span className="text-xs text-[var(--pa-muted)] sm:text-sm">
            GTFS: {new Date(String(data.generated_at)).toLocaleString("it-IT")}
          </span>
        ) : null}
      </div>

      {error ? <DataUnavailable message={error} /> : null}

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        <KpiCard
          label={t("Fermate bus (8 km)")}
          value={valueOrMissing(data?.kpi?.fermate_bus, formatInteger)}
          hint={data?.bus?.agency}
          icon={Bus}
          variant="info"
        />
        <KpiCard
          label={t("Linee bus")}
          value={valueOrMissing(data?.kpi?.linee_bus, formatInteger)}
          icon={Bus}
        />
        <KpiCard
          label={t("Stazioni FS vicine")}
          value={valueOrMissing(data?.kpi?.stazioni_fs, formatInteger)}
          hint={t("Partenze campione da S.Vincenzo")}
          icon={Train}
        />
        <KpiCard
          label={t("Tratti ciclabili")}
          value={valueOrMissing(data?.kpi?.tratti_ciclabili, formatInteger)}
          icon={Bike}
          variant="success"
        />
        <KpiCard
          label={t("Aree pedonali")}
          value={valueOrMissing(data?.kpi?.aree_pedonali, formatInteger)}
          icon={Footprints}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-xs sm:text-sm">
        {(
          [
            [showBus, setShowBus, t("Fermate bus")],
            [showTrain, setShowTrain, t("Stazioni FS")],
            [showCiclabili, setShowCiclabili, t("Ciclabili")],
            [showPedonali, setShowPedonali, t("Pedonali")],
          ] as const
        ).map(([on, setOn, label]) => (
          <label key={label} className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={on}
              onChange={(e) => setOn(e.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="mb-4">
        {loading && !data ? (
          <LoadingBlock label={t("Caricamento trasporti…")} />
        ) : (
          <TrasportiMap
            busStops={busStops}
            trainStops={trainStops}
            ciclabili={data?.ciclabili?.geojson ?? null}
            pedonali={data?.pedonali?.geojson ?? null}
            showBus={showBus}
            showTrain={showTrain}
            showCiclabili={showCiclabili}
            showPedonali={showPedonali}
          />
        )}
      </div>

      {upcomingTrains.length > 0 ? (
        <div className="mb-4 panel overflow-x-auto p-0">
          <div className="px-3 pt-3 sm:px-4 sm:pt-4">
            <h3 className="m-0 flex items-center gap-2">
              <Train
                size={20}
                className="shrink-0 text-[var(--pa-primary)]"
                aria-hidden
              />
              {t("Partenze FS da S.Vincenzo (campione GTFS)")}
            </h3>
            <p className="mb-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
              {t(
                "Orari indicativi dal feed Trenitalia: verificare sempre sul canale ufficiale.",
              )}
            </p>
          </div>
          <table className="mt-2 min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Ora")}</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Destinazione")}</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Linea")}</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTrains.map((d, i) => (
                <tr
                  key={`${d.time}-${d.headsign}-${i}`}
                  className="border-t border-[#eef2f5]"
                >
                  <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                    {hhmm(d.time)}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {d.headsign || "—"}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {d.route || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {routes.length > 0 ? (
        <div className="mb-4 panel overflow-x-auto p-0">
          <div className="px-3 pt-3 sm:px-4 sm:pt-4">
            <h3 className="m-0 flex items-center gap-2">
              <Bus
                size={20}
                className="shrink-0 text-[var(--pa-primary)]"
                aria-hidden
              />
              {t("Linee Autolinee Toscane che servono San Vincenzo")}
            </h3>
          </div>
          <table className="mt-2 min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#e8f2fc] text-[#17324d]">
              <tr>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Linea")}</th>
                <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Percorso")}</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.route_id} className="border-t border-[#eef2f5]">
                  <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                    {r.short_name || r.route_id}
                  </td>
                  <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                    {r.long_name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mb-4 panel overflow-x-auto p-0">
        <div className="flex flex-wrap items-end justify-between gap-2 px-3 pt-3 sm:px-4 sm:pt-4">
          <div>
            <h3 className="m-0">{t("Fermate bus più vicine")}</h3>
            <p className="mb-0 mt-1 text-xs text-[var(--pa-muted)] sm:text-sm">
              {t("Distanza dal centro comunale · filtra per nome o linea")}
            </p>
          </div>
          <label className="text-xs sm:text-sm">
            <span className="sr-only">{t("Cerca fermata")}</span>
            <input
              type="search"
              value={stopQuery}
              onChange={(e) => setStopQuery(e.target.value)}
              placeholder={t("Cerca fermata o linea…")}
              className="min-h-11 rounded border border-[var(--pa-border)] px-3 py-2"
            />
          </label>
        </div>
        <table className="mt-2 min-w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#e8f2fc] text-[#17324d]">
            <tr>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Fermata")}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Distanza")}</th>
              <th className="px-2 py-1.5 sm:px-3 sm:py-2">{t("Linee")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStops.map((s) => (
              <tr key={s.stop_id} className="border-t border-[#eef2f5]">
                <td className="px-2 py-1.5 font-semibold sm:px-3 sm:py-2">
                  {s.name || s.stop_id}
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {s.dist_km != null
                    ? `${formatDecimal(s.dist_km, 1)} km`
                    : "—"}
                </td>
                <td className="px-2 py-1.5 sm:px-3 sm:py-2">
                  {(s.routes_sample ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
            {filteredStops.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-2 py-3 text-[var(--pa-muted)] sm:px-3"
                >
                  {t("Nessuna fermata trovata.")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] text-[#5b6f82] sm:text-xs">
        Fonti:{" "}
        <a
          href={RT_ORARITB_DATASET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Regione Toscana — Orari TPL (GTFS)
        </a>
        {" · "}
        <a
          href={CICLABILI_DATASET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Aree ciclabili
        </a>
        {" · "}
        <a
          href={PEDONALI_DATASET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Aree pedonali
        </a>
        {data?.note ? ` — ${data.note}` : null}
      </p>
    </section>
  );
}
