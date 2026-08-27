/**
 * Catalogo fonti del cruscotto.
 * Nazionale = funziona con il solo codice ISTAT.
 * Opzionale = flag in config/comune.json → features.*
 */
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";
export type FonteAmbito = "nazionale" | "opzionale";

export type FonteVoce = {
  id: string;
  nome: string;
  ente: string;
  ambito: FonteAmbito;
  feature?: keyof import("@/lib/comune-config").ComuneFeatures;
  url: string;
  licenza: string;
  nota: string;
  sezione?: string;
  exportApi?: string;
};

export const FONTI: FonteVoce[] = [
  {
    id: "agid",
    nome: "Cruscotto Italia",
    ente: "AgID",
    ambito: "nazionale",
    url: "https://cruscotto-italia.dati.gov.it/",
    licenza: "CC BY 4.0",
    nota: "KPI comunali filtrati per codice ISTAT.",
    sezione: "panoramica",
    exportApi: "/api/pubblico/kpi",
  },
  {
    id: "turismo",
    nome: "Movimento clienti negli esercizi ricettivi",
    ente: "ISTAT / Regione",
    ambito: "opzionale",
    feature: "turismo_flussi",
    url: "https://www.istat.it/",
    licenza: "CC BY 4.0",
    nota: "Arrivi e presenze. Alimenta anche gli abitanti equivalenti.",
    sezione: "turismo",
    exportApi: "/api/pubblico/turismo",
  },
  {
    id: "ispra-rifiuti",
    nome: "Catasto nazionale rifiuti urbani",
    ente: "ISPRA",
    ambito: "nazionale",
    feature: "rifiuti_ispra",
    url: "https://www.catasto-rifiuti.isprambiente.it/",
    licenza: "CC BY 4.0",
    nota: "Produzione e RD per comune.",
    sezione: "ambiente",
    exportApi: "/api/pubblico/rifiuti",
  },
  {
    id: "dait",
    nome: "Amministratori locali",
    ente: "Ministero dell'Interno — DAIT",
    ambito: "nazionale",
    feature: "chi_amministra",
    url: "https://dait.interno.gov.it/elezioni/anagrafe-amministratori",
    licenza: "dati pubblici",
    nota: "Sindaco, giunta, consiglio. Serve regione_opendata.dait_provincia_slug.",
    sezione: "chi-amministra",
    exportApi: "/api/pubblico/amministratori",
  },
  {
    id: "ingv",
    nome: "Terremoti recenti",
    ente: "INGV",
    ambito: "nazionale",
    feature: "terremoti",
    url: "https://webservices.ingv.it/fdsnws/event/1/",
    licenza: "CC BY 4.0",
    nota: "Eventi nel bounding box comunale (FDSN GeoJSON).",
    sezione: "territorio",
    exportApi: "/api/pubblico/terremoti",
  },
  {
    id: "ipa",
    nome: "Domicili digitali e codici PA",
    ente: "IPA / DigitPA",
    ambito: "nazionale",
    feature: "ipa",
    url: "https://indicepa.gov.it/",
    licenza: "CC BY 4.0",
    nota: "PEC, codice IPA, codice univoco di fatturazione.",
    sezione: "societa",
    exportApi: "/api/pubblico/ipa",
  },
  {
    id: "istat-d7b",
    nome: "Bilancio demografico mensile",
    ente: "ISTAT",
    ambito: "nazionale",
    feature: "demografia_mensile",
    url: "https://demo.istat.it/",
    licenza: "CC BY 4.0",
    nota: "Serie D7B. L’anno in corso può non essere ancora pubblicato.",
    sezione: "societa",
    exportApi: "/api/pubblico/demografia-mensile",
  },
  {
    id: "effis",
    nome: "Rischio incendi (FWI e hotspot)",
    ente: "EFFIS / Copernicus",
    ambito: "opzionale",
    feature: "incendi",
    url: "https://maps.effis.emergency.copernicus.eu/effis",
    licenza: "Copernicus open data",
    nota: "WMS Fire Weather Index e hotspot. Ha senso con copertura boschiva.",
    sezione: "ambiente",
  },
  {
    id: "alberi",
    nome: "Alberi monumentali",
    ente: "MASAF",
    ambito: "opzionale",
    feature: "alberi_monumentali",
    url: "https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/11260",
    licenza: "dati pubblici",
    nota: "GeoJSON locale prodotto da scripts/sync-alberi-monumentali.mjs, non scaricato a runtime.",
    sezione: "mappa",
  },
  {
    id: "stazioni-wfs",
    nome: "Stazioni meteo-idro regionali",
    ente: "Agenzia regionale",
    ambito: "opzionale",
    feature: "stazioni_regionali",
    url: COMUNE.regione_opendata.stazioni_wfs.base_url || "https://www.dati.gov.it/",
    licenza: "secondo la Regione",
    nota: "WFS OGC da regione_opendata.stazioni_wfs. Dati misurati nel comune.",
    sezione: "meteo",
    exportApi: "/api/pubblico/stazioni",
  },
  {
    id: "rifiuti-agenzia",
    nome: "Agenzia regionale rifiuti",
    ente: "Agenzia regionale",
    ambito: "opzionale",
    feature: "rifiuti_agenzia_regionale",
    url: COMUNE.gestori.rifiuti.agenzia_regionale.pagina_indice || "https://www.dati.gov.it/",
    licenza: "secondo la Regione",
    nota: "L’URL del file si risolve dalla pagina indice, non è in configurazione.",
    sezione: "ambiente",
    exportApi: "/api/pubblico/rifiuti-agenzia",
  },
  {
    id: "pgra",
    nome: "Pericolosità idraulica PAI/PGRA",
    ente: "Autorità di bacino",
    ambito: "opzionale",
    feature: "pericolosita_idraulica",
    url: COMUNE.regione_opendata.pgra_arcgis.base_url || "https://www.dati.gov.it/",
    licenza: "secondo l’ente",
    nota: "ArcGIS REST da regione_opendata.pgra_arcgis.",
    sezione: "territorio",
    exportApi: "/api/pubblico/pgra",
  },
];

export const FONTI_NON_DISPONIBILI_DOC = "/fonti-non-disponibili";

export function fontiAttive(): FonteVoce[] {
  return FONTI.filter((f) => !f.feature || isFeatureEnabled(f.feature));
}
