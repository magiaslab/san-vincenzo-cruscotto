"use client";

import { useT } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pill } from "lucide-react";
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  OSM_COPYRIGHT_URL,
} from "@/lib/constants";
import {
  DataUnavailable,
  LoadingBlock,
  PanelHeading,
  SolidLink,
} from "@/components/ui";

type GeoFeature = {
  type: "Feature";
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

function FitPoints({ points }: { points: [number, number][] }) {
  const t = useT();
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

/** Mappa farmacie e parafarmacie MDS (coordinate da Cruscotto Italia). */
export function FarmacieMap() {
  const t = useT();
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mappa?layers=sanita")
      .then((r) => {
        if (!r.ok) throw new Error("mappa");
        return r.json();
      })
      .then((json: { layers?: Record<string, FeatureCollection> }) => {
        if (cancelled) return;
        setData(json.layers?.sanita ?? { type: "FeatureCollection", features: [] });
      })
      .catch(() => {
        if (!cancelled) setError("Impossibile caricare la mappa farmacie");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const points = useMemo(() => {
    if (!data?.features?.length) return [] as [number, number][];
    const pts: [number, number][] = [];
    for (const f of data.features) {
      if (f.geometry?.type !== "Point") continue;
      const [lon, lat] = f.geometry.coordinates;
      if (typeof lat === "number" && typeof lon === "number") pts.push([lat, lon]);
    }
    return pts;
  }, [data]);

  return (
    <div className="panel overflow-hidden p-0">
      <div className="border-b border-[var(--pa-border)] px-4 py-3">
        <PanelHeading
          title={t("Mappa farmacie e parafarmacie")}
          description={`${data?.features.length ?? 0} punti georeferenziati (anagrafe Ministero della Salute).`}
          icon={Pill}
          actions={
            <SolidLink href="https://www.dati.salute.gov.it/">Fonte MDS</SolidLink>
          }
          className="mb-0"
        />
      </div>
      <div className="relative z-0 h-[320px] w-full overflow-hidden sm:h-[400px]">
        {loading ? <LoadingBlock label={t("Caricamento mappa farmacie…")} /> : null}
        {error ? (
          <div className="p-4">
            <DataUnavailable message={error} />
          </div>
        ) : null}
        {!loading && !error && data && data.features.length === 0 ? (
          <div className="p-4">
            <DataUnavailable message={t("Nessuna farmacia georeferenziata disponibile.")} />
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
              const tipo = String(f.properties.tipo ?? "Farmacia");
              const isFarmacia = tipo.toLowerCase().includes("farmacia");
              return (
                <CircleMarker
                  key={`sanita-${String(f.properties.nome ?? i)}`}
                  center={[lat, lon]}
                  radius={9}
                  pathOptions={{
                    color: isFarmacia ? "#0066CC" : "#008758",
                    fillColor: isFarmacia ? "#0066CC" : "#008758",
                    fillOpacity: 0.85,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <strong>{String(f.properties.nome ?? "")}</strong>
                    <br />
                    {tipo}
                    <br />
                    {String(f.properties.indirizzo ?? "")}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        ) : null}
      </div>
      <p className="m-0 border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-2 text-xs text-[var(--pa-muted)]">
        Blu = farmacia · Verde = parafarmacia · Base{" "}
        <a
          href={OSM_COPYRIGHT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          OpenStreetMap
        </a>
      </p>
    </div>
  );
}
