"use client";

import { useEffect } from "react";
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
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  OSM_COPYRIGHT_URL,
} from "@/lib/constants";
import { useT } from "@/lib/i18n";

type AcquaProps = {
  kind?: string;
  acquedotto?: string;
  cod_acq?: string;
  strada?: string;
  ubicazione?: string;
  alta_qualita?: boolean;
  tipo?: string;
};

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(id);
  }, [map]);
  return null;
}

function FitAll({ geojson }: { geojson: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    if (geojson.features.length === 0) {
      map.setView(MAP_CENTER, MAP_DEFAULT_ZOOM, { animate: false });
      return;
    }
    try {
      const layer = L.geoJSON(geojson);
      const b = layer.getBounds();
      if (b.isValid()) {
        map.fitBounds(b, { padding: [28, 28], maxZoom: 15 });
      }
    } catch {
      map.setView(MAP_CENTER, MAP_DEFAULT_ZOOM, { animate: false });
    }
    window.setTimeout(() => map.invalidateSize(), 100);
  }, [map, geojson]);
  return null;
}

export function AcquaMap({ geojson }: { geojson: FeatureCollection }) {
  const t = useT();
  const polygons = geojson.features.filter(
    (f) =>
      f.geometry &&
      (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"),
  );
  const points = geojson.features.filter(
    (f) => f.geometry?.type === "Point",
  ) as Array<Feature<Extract<Geometry, { type: "Point" }>, AcquaProps>>;

  return (
    <div className="relative z-0 h-[320px] w-full overflow-hidden sm:h-[420px]">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          attribution={`&copy; <a href="${OSM_COPYRIGHT_URL}">OpenStreetMap</a>`}
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapReady />
        <FitAll geojson={geojson} />
        {polygons.map((f, i) => {
          const p = (f.properties ?? {}) as AcquaProps;
          return (
            <GeoJSON
              key={`poly-${String(f.id ?? i)}`}
              data={f}
              style={() => ({
                color: "#0b6e99",
                weight: 2,
                fillColor: "#4aa3c7",
                fillOpacity: 0.22,
              })}
            >
              <Popup>
                <strong>{p.acquedotto || t("Etichetta")}</strong>
                {p.cod_acq ? (
                  <>
                    <br />
                    {p.cod_acq}
                  </>
                ) : null}
              </Popup>
            </GeoJSON>
          );
        })}
        {points.map((f, i) => {
          const p = (f.properties ?? {}) as AcquaProps;
          const [lon, lat] = f.geometry.coordinates;
          const aq = Boolean(p.alta_qualita);
          return (
            <CircleMarker
              key={`pt-${String(f.id ?? i)}`}
              center={[lat, lon]}
              radius={aq ? 9 : 7}
              pathOptions={{
                color: aq ? "#008758" : "#0b6e99",
                fillColor: aq ? "#008758" : "#0b6e99",
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{p.strada || p.tipo || t("Fontanella")}</strong>
                {p.ubicazione ? (
                  <>
                    <br />
                    {p.ubicazione}
                  </>
                ) : null}
                {aq ? (
                  <>
                    <br />
                    {t("Alta qualità")}
                  </>
                ) : null}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
