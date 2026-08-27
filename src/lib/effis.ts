/**
 * Rischio incendi — WMS EFFIS / Copernicus (FWI e hotspot).
 * Overlay sulla mappa: nessun download di raster a runtime.
 */
import { isFeatureEnabled } from "@/lib/comune-config";

export const EFFIS_FONTE = "EFFIS / Copernicus Emergency Management Service";
export const EFFIS_WMS_URL =
  "https://maps.effis.emergency.copernicus.eu/effis";
export const EFFIS_VIEWER_URL =
  "https://maps.effis.emergency.copernicus.eu/effis";
/** Fire Weather Index corrente. */
export const EFFIS_FWI_LAYER = "mfwi";
/** Hotspot MODIS (fuochi attivi). */
export const EFFIS_HOTSPOT_LAYER = "modis.hs";

export type IncendiData = {
  wmsUrl: string;
  fwiLayer: string;
  hotspotLayer: string;
  viewerUrl: string;
  note: string | null;
};

export function emptyIncendi(note: string): IncendiData {
  return {
    wmsUrl: EFFIS_WMS_URL,
    fwiLayer: EFFIS_FWI_LAYER,
    hotspotLayer: EFFIS_HOTSPOT_LAYER,
    viewerUrl: EFFIS_VIEWER_URL,
    note,
  };
}

export async function buildIncendi(): Promise<IncendiData> {
  if (!isFeatureEnabled("incendi")) {
    return emptyIncendi("Modulo spento (features.incendi).");
  }
  return {
    wmsUrl: EFFIS_WMS_URL,
    fwiLayer: EFFIS_FWI_LAYER,
    hotspotLayer: EFFIS_HOTSPOT_LAYER,
    viewerUrl: EFFIS_VIEWER_URL,
    note: "Indice FWI e hotspot MODIS via WMS. Overlay sulla mappa comunale; i raster non vengono scaricati lato server.",
  };
}
