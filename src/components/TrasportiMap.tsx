"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  GeoJSON,
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
import { useT } from "@/lib/i18n";

type Stop = {
  stop_id: string;
  name?: string | null;
  lat: number;
  lon: number;
  dist_km?: number;
  routes_sample?: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureCollection = any;

function isWgs84Point(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => {
      map.invalidateSize();
    }, 80);
    return () => window.clearTimeout(id);
  }, [map]);
  return null;
}

function FitLayers({
  stops,
  ciclabili,
  pedonali,
}: {
  stops: Stop[];
  ciclabili: FeatureCollection | null;
  pedonali: FeatureCollection | null;
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([]);
    for (const s of stops) {
      if (isWgs84Point(s.lat, s.lon)) bounds.extend([s.lat, s.lon]);
    }
    for (const fc of [ciclabili, pedonali]) {
      if (!fc?.features?.length) continue;
      try {
        const layer = L.geoJSON(fc);
        const b = layer.getBounds();
        if (b.isValid()) {
          const c = b.getCenter();
          if (isWgs84Point(c.lat, c.lng)) bounds.extend(b);
        }
      } catch {
        // geometria non valida
      }
    }
    if (!bounds.isValid()) {
      map.setView(MAP_CENTER, MAP_DEFAULT_ZOOM, { animate: false });
      return;
    }
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    window.setTimeout(() => map.invalidateSize(), 100);
  }, [map, stops, ciclabili, pedonali]);
  return null;
}

export function TrasportiMap({
  busStops,
  trainStops,
  ciclabili,
  pedonali,
  showBus,
  showTrain,
  showCiclabili,
  showPedonali,
}: {
  busStops: Stop[];
  trainStops: Stop[];
  ciclabili: FeatureCollection | null;
  pedonali: FeatureCollection | null;
  showBus: boolean;
  showTrain: boolean;
  showCiclabili: boolean;
  showPedonali: boolean;
}) {
  const t = useT();
  const bus = useMemo(
    () =>
      showBus
        ? busStops.filter((s) => isWgs84Point(s.lat, s.lon))
        : [],
    [busStops, showBus],
  );
  const train = useMemo(
    () =>
      showTrain
        ? trainStops.filter((s) => isWgs84Point(s.lat, s.lon))
        : [],
    [trainStops, showTrain],
  );

  const safeCiclabili =
    showCiclabili && ciclabili?.features?.length ? ciclabili : null;
  const safePedonali =
    showPedonali && pedonali?.features?.length ? pedonali : null;

  return (
    <div className="panel overflow-hidden p-0">
      <div className="relative z-0 h-[380px] w-full overflow-hidden sm:h-[460px]">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution={`&copy; <a href="${OSM_COPYRIGHT_URL}">OpenStreetMap</a>`}
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapReady />
          <FitLayers
            stops={[...bus, ...train]}
            ciclabili={safeCiclabili}
            pedonali={safePedonali}
          />
          {safePedonali ? (
            <GeoJSON
              data={safePedonali}
              style={() => ({
                color: "#5B2C6F",
                weight: 1,
                fillColor: "#9B59B6",
                fillOpacity: 0.28,
              })}
            />
          ) : null}
          {safeCiclabili ? (
            <GeoJSON
              data={safeCiclabili}
              style={() => ({
                color: "#008758",
                weight: 2,
                fillColor: "#2ECC71",
                fillOpacity: 0.35,
              })}
            />
          ) : null}
          {bus.map((s) => (
            <CircleMarker
              key={`b-${s.stop_id}`}
              center={[s.lat, s.lon]}
              radius={5}
              pathOptions={{
                color: "#0066CC",
                fillColor: "#0066CC",
                fillOpacity: 0.85,
                weight: 1,
              }}
            >
              <Popup>
                <strong>{s.name ?? s.stop_id}</strong>
                <br />
                {t("Fermata bus")}
                {s.dist_km != null ? ` · ${s.dist_km} km` : ""}
                {s.routes_sample?.length ? (
                  <>
                    <br />
                    {t("Linee")}: {s.routes_sample.join(", ")}
                  </>
                ) : null}
              </Popup>
            </CircleMarker>
          ))}
          {train.map((s) => (
            <CircleMarker
              key={`t-${s.stop_id}`}
              center={[s.lat, s.lon]}
              radius={8}
              pathOptions={{
                color: "#D9364F",
                fillColor: "#D9364F",
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{s.name ?? s.stop_id}</strong>
                <br />
                {t("Stazione FS")}
                {s.dist_km != null ? ` · ${s.dist_km} km` : ""}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="m-0 border-t border-[var(--pa-border)] bg-[var(--pa-surface-soft)] px-4 py-2 text-xs text-[var(--pa-muted)]">
        {t("Legenda")}:{" "}
        <span className="font-semibold text-[#0066CC]">{t("fermate bus")}</span>
        {" · "}
        <span className="font-semibold text-[#D9364F]">{t("stazioni FS")}</span>
        {" · "}
        <span className="font-semibold text-[#008758]">{t("ciclabili")}</span>
        {" · "}
        <span className="font-semibold text-[#5B2C6F]">{t("pedonali")}</span>
      </p>
    </div>
  );
}
