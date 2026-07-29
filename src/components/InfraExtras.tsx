"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  OSM_COPYRIGHT_URL,
} from "@/lib/constants";
import { DataUnavailable, LoadingBlock } from "@/components/ui";
import { formatDecimal } from "@/lib/format";

type GeoFeature = {
  type: "Feature";
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
  meta?: Record<string, unknown>;
};

function FitPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function MapShell({
  title,
  description,
  sourceLabel,
  sourceUrl,
  children,
  footer,
  heightClass = "h-[360px] sm:h-[440px]",
}: {
  title: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  children: ReactNode;
  footer?: ReactNode;
  heightClass?: string;
}) {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#d9e6f2] px-4 py-3">
        <div>
          <h3 className="m-0 text-base font-bold text-[#17324d]">{title}</h3>
          <p className="m-0 mt-1 text-sm text-[#5b6f82]">{description}</p>
        </div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full bg-[#0066CC] px-3 py-1.5 text-sm font-semibold text-white no-underline"
        >
          Fonte ufficiale
        </a>
      </div>
      <div className={`relative w-full ${heightClass}`}>{children}</div>
      <p className="m-0 border-t border-[#d9e6f2] bg-[#f5f8fc] px-4 py-2 text-xs text-[#5b6f82]">
        Fonte:{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {sourceLabel}
        </a>
        {" · "}
        Base{" "}
        <a
          href={OSM_COPYRIGHT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>
        {footer}
      </p>
    </div>
  );
}

function useMapLayer(layer: string) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/mappa?layers=${encodeURIComponent(layer)}`)
      .then((r) => {
        if (!r.ok) throw new Error("mappa");
        return r.json();
      })
      .then((json: { layers?: Record<string, FeatureCollection> }) => {
        if (cancelled) return;
        setData(json.layers?.[layer] ?? { type: "FeatureCollection", features: [] });
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare i punti sulla mappa");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [layer]);

  return { data, error, loading };
}

function pointsFrom(fc: FeatureCollection | null): [number, number][] {
  if (!fc?.features?.length) return [];
  const pts: [number, number][] = [];
  for (const f of fc.features) {
    if (f.geometry?.type !== "Point") continue;
    const [lon, lat] = f.geometry.coordinates;
    if (typeof lat === "number" && typeof lon === "number") pts.push([lat, lon]);
  }
  return pts;
}

/** Mappa Leaflet dei punti di ricarica EV (PUN / IDR via Cruscotto Italia). */
export function PunIdrMap() {
  const { data, error, loading } = useMapLayer("ev");
  const points = useMemo(() => pointsFrom(data), [data]);
  const nAttivi = useMemo(
    () => data?.features.filter((f) => Boolean(f.properties.attivo)).length ?? 0,
    [data],
  );

  return (
    <MapShell
      title="Mappa colonnine di ricarica (PUN / IDR)"
      description={`${data?.features.length ?? 0} punti EV georeferenziati nel comune · ${nAttivi} attivi.`}
      sourceLabel="PUN / IDR (Cruscotto Italia)"
      sourceUrl="https://www.piattaformaunicanazionale.it/idr"
      footer=" · verde = attivo, rosso = non attivo"
    >
      {loading ? <LoadingBlock label="Caricamento colonnine…" /> : null}
      {error ? (
        <div className="p-4">
          <DataUnavailable message={error} />
        </div>
      ) : null}
      {!loading && !error && data && data.features.length === 0 ? (
        <div className="p-4">
          <DataUnavailable message="Nessun punto di ricarica georeferenziato disponibile." />
        </div>
      ) : null}
      {!loading && !error && data && data.features.length > 0 ? (
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitPoints points={points} />
          {data.features.map((f, i) => {
            const [lon, lat] = f.geometry.coordinates;
            const attivo = Boolean(f.properties.attivo);
            return (
              <CircleMarker
                key={`ev-${String(f.properties.id ?? i)}`}
                center={[lat, lon]}
                radius={8}
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
                  {f.properties.categoria
                    ? ` · ${String(f.properties.categoria)}`
                    : ""}
                  {f.properties.corrente
                    ? ` · ${String(f.properties.corrente)}`
                    : ""}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      ) : null}
    </MapShell>
  );
}

function prezzoLabel(prezzi: unknown, key: string): string | null {
  if (!prezzi || typeof prezzi !== "object") return null;
  const v = (prezzi as Record<string, unknown>)[key];
  return typeof v === "number" ? `${formatDecimal(v, 3)} €/L` : null;
}

/** Mappa Leaflet degli impianti carburanti (MIMIT via Cruscotto Italia). */
export function CarburantiMap() {
  const { data, error, loading } = useMapLayer("carburanti");
  const points = useMemo(() => pointsFrom(data), [data]);

  return (
    <MapShell
      title="Mappa impianti carburanti"
      description={`${data?.features.length ?? 0} impianti georeferenziati nel comune (prezzi MIMIT).`}
      sourceLabel="Osservatorio prezzi carburanti (MIMIT)"
      sourceUrl="https://www.mimit.gov.it/it/open-data/elenco-dataset/osservatorio-prezzi-carburanti"
    >
      {loading ? <LoadingBlock label="Caricamento impianti…" /> : null}
      {error ? (
        <div className="p-4">
          <DataUnavailable message={error} />
        </div>
      ) : null}
      {!loading && !error && data && data.features.length === 0 ? (
        <div className="p-4">
          <DataUnavailable message="Nessun impianto carburanti georeferenziato disponibile." />
        </div>
      ) : null}
      {!loading && !error && data && data.features.length > 0 ? (
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
          attributionControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitPoints points={points} />
          {data.features.map((f, i) => {
            const [lon, lat] = f.geometry.coordinates;
            const benzina = prezzoLabel(f.properties.prezzi, "benzina_self");
            const gasolio = prezzoLabel(f.properties.prezzi, "gasolio_self");
            return (
              <CircleMarker
                key={`fuel-${i}`}
                center={[lat, lon]}
                radius={8}
                pathOptions={{
                  color: "#CC7A00",
                  fillColor: "#CC7A00",
                  fillOpacity: 0.85,
                  weight: 1,
                }}
              >
                <Popup>
                  <strong>{String(f.properties.nome ?? "Impianto")}</strong>
                  <br />
                  {String(f.properties.brand ?? "")}
                  {f.properties.tipo ? ` · ${String(f.properties.tipo)}` : ""}
                  <br />
                  {String(f.properties.indirizzo ?? "")}
                  {benzina ? (
                    <>
                      <br />
                      Benzina self: {benzina}
                    </>
                  ) : null}
                  {gasolio ? (
                    <>
                      <br />
                      Gasolio self: {gasolio}
                    </>
                  ) : null}
                  {f.properties.aggiornato ? (
                    <>
                      <br />
                      Aggiornato: {String(f.properties.aggiornato)}
                    </>
                  ) : null}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      ) : null}
    </MapShell>
  );
}

/** Pannello copertura FTTH (AGCOM): nessun layer geografico pubblico nel payload MCP. */
export function BandaUltralargaPanel({
  ftthPct,
  ftth20mPct,
}: {
  ftthPct?: number | null;
  ftth20mPct?: number | null;
}) {
  const pct = typeof ftthPct === "number" ? ftthPct : null;
  const pct20 = typeof ftth20mPct === "number" ? ftth20mPct : null;

  return (
    <div className="panel">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="m-0 text-base font-bold text-[#17324d]">
            Copertura banda ultralarga / FTTH
          </h3>
          <p className="m-0 mt-1 text-sm text-[#5b6f82]">
            Indicatori AGCOM Broadband Map per San Vincenzo. La mappa ufficiale
            nazionale non espone layer incorporabili: apri il portale per i
            dettagli civico per civico.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://geo.agcom.it/agcomapps/BB4/BB4_BBwired_na_app16_4/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-[#0066CC] px-3 py-1.5 text-sm font-semibold text-white no-underline"
          >
            Mappa AGCOM
          </a>
          <a
            href="https://bandaultralarga.italia.it/mappa/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-[#0066CC] bg-white px-3 py-1.5 text-sm font-semibold text-[#0066CC] no-underline"
          >
            Banda Ultralarga
          </a>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CoverageBar label="Copertura FTTH (DESI)" value={pct} color="#0066CC" />
        <CoverageBar label="FTTH entro 20 m" value={pct20} color="#008758" />
      </div>
    </div>
  );
}

function CoverageBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  const width = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-[#5b6f82]">{label}</span>
        <strong className="text-[#17324d]">
          {value == null ? "n.d." : `${formatDecimal(value, 0)}%`}
        </strong>
      </div>
      <div className="h-2.5 overflow-hidden rounded bg-[#e8eef4]">
        <div
          className="h-full rounded transition-[width] duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** @deprecated alias per compatibilità import dinamici */
export const BandaUltralargaMap = CarburantiMap;
