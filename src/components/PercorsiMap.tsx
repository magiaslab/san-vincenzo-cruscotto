"use client";

import { useEffect } from "react";
import {
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature as GeoFeature, FeatureCollection } from "geojson";
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  OSM_COPYRIGHT_URL,
} from "@/lib/constants";
import { useT } from "@/lib/i18n";
import {
  percorsoColor,
  type PercorsiGeoJSON,
  type PercorsoTipo,
} from "@/lib/percorsi";

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(id);
  }, [map]);
  return null;
}

function FitSelected({
  geojson,
  selectedId,
}: {
  geojson: PercorsiGeoJSON;
  selectedId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    const feats = selectedId
      ? geojson.features.filter((f) => f.id === selectedId)
      : geojson.features;
    if (feats.length === 0) {
      map.setView(MAP_CENTER, MAP_DEFAULT_ZOOM, { animate: false });
      return;
    }
    try {
      const layer = L.geoJSON({
        type: "FeatureCollection",
        features: feats,
      } as FeatureCollection);
      const b = layer.getBounds();
      if (b.isValid()) {
        map.fitBounds(b, { padding: [28, 28], maxZoom: 15 });
      }
    } catch {
      map.setView(MAP_CENTER, MAP_DEFAULT_ZOOM, { animate: false });
    }
    window.setTimeout(() => map.invalidateSize(), 100);
  }, [map, geojson, selectedId]);
  return null;
}

export function PercorsiMap({
  geojson,
  selectedId,
  onSelect,
}: {
  geojson: PercorsiGeoJSON;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useT();

  return (
    <div className="relative z-0 h-[360px] w-full overflow-hidden sm:h-[460px]">
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
        <FitSelected geojson={geojson} selectedId={selectedId} />
        {geojson.features.map((f) => {
          const tipo = f.properties.tipo as PercorsoTipo;
          const active = f.id === selectedId;
          const color = percorsoColor(tipo);
          return (
            <GeoJSON
              key={`${String(f.id)}-${active ? "on" : "off"}`}
              data={f as GeoFeature}
              style={() => ({
                color,
                weight: active ? 6 : 3,
                opacity: active ? 1 : 0.75,
              })}
              eventHandlers={{
                click: () => onSelect(String(f.id)),
              }}
            >
              <Popup>
                <strong>{f.properties.nome}</strong>
                <br />
                {t(labelTipo(tipo))}
                {f.properties.ref ? ` · ${f.properties.ref}` : ""}
                {f.properties.distanza_km != null
                  ? ` · ${f.properties.distanza_km} km`
                  : ""}
              </Popup>
            </GeoJSON>
          );
        })}
      </MapContainer>
    </div>
  );
}

function labelTipo(tipo: PercorsoTipo): string {
  switch (tipo) {
    case "bicycle":
      return "Ciclabile";
    case "mtb":
      return "MTB";
    case "hiking":
      return "Sentiero";
    default:
      return "Pedonale";
  }
}
