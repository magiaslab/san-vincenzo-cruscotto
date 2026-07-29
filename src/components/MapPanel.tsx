"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATASTO_GEOJSON_URL, MAP_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";
import {
  DataUnavailable,
  KpiCard,
  LoadingBlock,
  SectionIntro,
  valueOrMissing,
} from "@/components/ui";
import { formatInteger, formatPercent } from "@/lib/format";

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: string; coordinates: number[] | number[][][] };
    properties: Record<string, unknown>;
  }>;
  meta?: Record<string, unknown>;
};

type LayersResponse = {
  layers: Record<string, FeatureCollection>;
  catasto?: { url?: string; nota?: string };
};

function FitBounds({ collections }: { collections: FeatureCollection[] }) {
  const t = useT();
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    for (const fc of collections) {
      for (const f of fc.features) {
        if (f.geometry?.type === "Point") {
          const [lon, lat] = f.geometry.coordinates as number[];
          pts.push([lat, lon]);
        }
      }
    }
    if (pts.length > 0) {
      map.fitBounds(L.latLngBounds(pts), { padding: [24, 24], maxZoom: 14 });
    }
  }, [collections, map]);
  return null;
}

export default function MapPanel({ kpi }: { kpi?: Record<string, unknown> }) {
  const t = useT();
  const [data, setData] = useState<LayersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCivici, setShowCivici] = useState(true);
  const [showEv, setShowEv] = useState(true);
  const [showBeni, setShowBeni] = useState(true);
  const [showSanita, setShowSanita] = useState(true);
  const [showCatasto, setShowCatasto] = useState(false);
  const [catasto, setCatasto] = useState<FeatureCollection | null>(null);
  const [catastoLoading, setCatastoLoading] = useState(false);
  const [catastoError, setCatastoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mappa")
      .then((r) => {
        if (!r.ok) throw new Error("mappa");
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare i layer geografici");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showCatasto || catasto || catastoLoading) return;
    let cancelled = false;
    setCatastoLoading(true);
    setCatastoError(null);
    (async () => {
      try {
        const res = await fetch(CATASTO_GEOJSON_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const ds = new DecompressionStream("gzip");
        const stream = new Response(buf).body!.pipeThrough(ds);
        const text = await new Response(stream).text();
        const geo = JSON.parse(text) as FeatureCollection;
        // Limita feature per non bloccare il browser
        const limited: FeatureCollection = {
          ...geo,
          features: (geo.features ?? []).slice(0, 2500),
        };
        if (!cancelled) setCatasto(limited);
      } catch {
        if (!cancelled) {
          setCatastoError(
            "Impossibile caricare il layer catastale (file remoto troppo pesante o non supportato dal browser).",
          );
        }
      } finally {
        if (!cancelled) setCatastoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showCatasto, catasto, catastoLoading]);

  const visible = useMemo(() => {
    if (!data) return [];
    const list: FeatureCollection[] = [];
    if (showCivici && data.layers.civici) list.push(data.layers.civici);
    if (showEv && data.layers.ev) list.push(data.layers.ev);
    if (showBeni && data.layers.beni_culturali) list.push(data.layers.beni_culturali);
    if (showSanita && data.layers.sanita) list.push(data.layers.sanita);
    return list;
  }, [data, showCivici, showEv, showBeni, showSanita]);

  const beniMeta = data?.layers.beni_culturali?.meta;
  const beniUnavailable =
    beniMeta &&
    (beniMeta.disponibile === false || Number(beniMeta.n_con_coordinate ?? 0) === 0);

  const civiciKpi = (kpi?.civici_anncsu ?? null) as Record<string, unknown> | null;
  const evKpi = (kpi?.ricarica_ev_pun ?? null) as Record<string, unknown> | null;
  const beniKpi = (kpi?.beni_culturali_mic ?? null) as Record<string, unknown> | null;
  const sanitaKpi = (kpi?.sanita_mds ?? null) as Record<string, unknown> | null;

  return (
    <section>
      <SectionIntro
        title={t("Mappa")}
        description={t("Layer georeferenziati ANNCSU, punti EV, beni culturali e cartografia catastale. Base OpenStreetMap.")}
      />

      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("Civici ANNCSU")}
          value={valueOrMissing(civiciKpi?.n_civici, formatInteger)}
          hint={`${formatInteger(Number(civiciKpi?.n_strade) || null)} strade · geo ${formatPercent(Number(civiciKpi?.pct_geo_ref) || null)}`}
        />
        <KpiCard
          label={t("Punti EV")}
          value={valueOrMissing(evKpi?.n_totale, formatInteger)}
          hint={`${formatInteger(Number(evKpi?.n_attivi) || null)} attivi`}
        />
        <KpiCard
          label={t("Beni culturali geo")}
          value={valueOrMissing(beniKpi?.n_con_coordinate, formatInteger)}
          unavailable={Number(beniKpi?.n_con_coordinate ?? 0) === 0}
        />
        <KpiCard
          label={t("Farmacie geo")}
          value={valueOrMissing(sanitaKpi?.n_farmacie, formatInteger)}
          hint={`${formatInteger(Number(sanitaKpi?.n_parafarmacie) || null)} parafarmacie`}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs sm:gap-3 sm:text-sm">
        <label className="inline-flex cursor-pointer items-center gap-1.5 sm:gap-2">
          <input
            type="checkbox"
            checked={showCivici}
            onChange={(e) => setShowCivici(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          <span>Civici ANNCSU</span>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 sm:gap-2">
          <input
            type="checkbox"
            checked={showEv}
            onChange={(e) => setShowEv(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          <span>Punti ricarica EV</span>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 sm:gap-2">
          <input
            type="checkbox"
            checked={showBeni}
            onChange={(e) => setShowBeni(e.target.checked)}
            disabled={Boolean(beniUnavailable)}
            className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
          />
          <span>Beni culturali MiC</span>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 sm:gap-2">
          <input
            type="checkbox"
            checked={showSanita}
            onChange={(e) => setShowSanita(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          <span>Farmacie</span>
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 sm:gap-2">
          <input
            type="checkbox"
            checked={showCatasto}
            onChange={(e) => setShowCatasto(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          <span>Catasto (particelle)</span>
        </label>
      </div>

      {beniUnavailable ? (
        <div className="mb-3">
          <DataUnavailable message={t("Beni culturali MiC: nessun punto con coordinate per San Vincenzo.")} />
        </div>
      ) : null}
      {showCatasto && catastoError ? (
        <div className="mb-3">
          <DataUnavailable message={catastoError} />
        </div>
      ) : null}
      {showCatasto && catastoLoading ? (
        <LoadingBlock label={t("Download layer catastale…")} />
      ) : null}

      {error ? <DataUnavailable message={error} /> : null}
      {!data && !error ? <LoadingBlock label={t("Caricamento layer…")} /> : null}

      {data ? (
        <div className="overflow-hidden rounded-lg border border-[#d9e6f2]">
          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_DEFAULT_ZOOM}
            scrollWheelZoom
            className="h-[400px] w-full sm:h-[500px] lg:h-[560px]"
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds collections={visible} />

            {showCivici &&
              data.layers.civici?.features.map((f, i) => {
                const [lon, lat] = f.geometry.coordinates as number[];
                return (
                  <CircleMarker
                    key={`c-${i}`}
                    center={[lat, lon]}
                    radius={3}
                    pathOptions={{
                      color: "#0066CC",
                      fillColor: "#0066CC",
                      fillOpacity: 0.5,
                      weight: 1,
                    }}
                  >
                    <Popup>
                      {String(f.properties.odonimo ?? "")}{" "}
                      {String(f.properties.civico ?? "")}
                      {f.properties.esponente
                        ? `/${String(f.properties.esponente)}`
                        : ""}
                    </Popup>
                  </CircleMarker>
                );
              })}

            {showEv &&
              data.layers.ev?.features.map((f, i) => {
                const [lon, lat] = f.geometry.coordinates as number[];
                const attivo = Boolean(f.properties.attivo);
                return (
                  <CircleMarker
                    key={`e-${i}`}
                    center={[lat, lon]}
                    radius={7}
                    pathOptions={{
                      color: attivo ? "#008758" : "#D9364F",
                      fillColor: attivo ? "#008758" : "#D9364F",
                      fillOpacity: 0.85,
                      weight: 1,
                    }}
                  >
                    <Popup>
                      <strong>{attivo ? "Attivo" : "Non attivo"}</strong>
                      <br />
                      {String(f.properties.indirizzo ?? "")}
                      <br />
                      {String(f.properties.cpo ?? "")}
                      {f.properties.potenza_kw != null
                        ? ` · ${String(f.properties.potenza_kw)} kW`
                        : ""}
                    </Popup>
                  </CircleMarker>
                );
              })}

            {showBeni &&
              data.layers.beni_culturali?.features.map((f, i) => {
                const [lon, lat] = f.geometry.coordinates as number[];
                return (
                  <CircleMarker
                    key={`b-${i}`}
                    center={[lat, lon]}
                    radius={8}
                    pathOptions={{
                      color: "#5B2C6F",
                      fillColor: "#5B2C6F",
                      fillOpacity: 0.85,
                    }}
                  >
                    <Popup>{String(f.properties.nome ?? "Bene culturale")}</Popup>
                  </CircleMarker>
                );
              })}

            {showSanita &&
              data.layers.sanita?.features.map((f, i) => {
                const [lon, lat] = f.geometry.coordinates as number[];
                return (
                  <CircleMarker
                    key={`s-${i}`}
                    center={[lat, lon]}
                    radius={8}
                    pathOptions={{
                      color: "#CC7A00",
                      fillColor: "#CC7A00",
                      fillOpacity: 0.85,
                    }}
                  >
                    <Popup>
                      <strong>{String(f.properties.nome ?? "")}</strong>
                      <br />
                      {String(f.properties.tipo ?? "")}
                      <br />
                      {String(f.properties.indirizzo ?? "")}
                    </Popup>
                  </CircleMarker>
                );
              })}

            {showCatasto && catasto ? (
              <GeoJSON
                data={catasto as GeoJSON.FeatureCollection}
                style={() => ({
                  color: "#666",
                  weight: 0.6,
                  fillOpacity: 0.05,
                })}
              />
            ) : null}
          </MapContainer>
          {data.layers.civici?.meta?.truncated ? (
            <p className="m-0 border-t border-[#d9e6f2] bg-[#f5f6f7] px-3 py-2 text-xs text-[#5b6f82]">
              Civici: campione troncato lato server (
              {String(data.layers.civici.features.length)} punti mostrati
              {data.layers.civici.meta.n_civici_kpi
                ? ` su ${String(data.layers.civici.meta.n_civici_kpi)} totali`
                : ""}
              ).
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
