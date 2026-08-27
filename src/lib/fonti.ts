/**
 * Catalogo fonti del Cruscotto Comune.
 * Nazionale = funziona in qualsiasi comune italiano con codice ISTAT.
 * Opzionale = si accende in `config/comune.json` → `features.*` e URL regionali/locali.
 */

export type FonteAmbito = "nazionale" | "opzionale";

export type FonteVoce = {
  nome: string;
  ente: string;
  ambito: FonteAmbito;
  feature?: string;
  url: string;
  licenza: string;
  nota: string;
};

export const FONTI: FonteVoce[] = [
  {
    nome: "Cruscotto Italia (MCP)",
    ente: "AgID",
    ambito: "nazionale",
    url: "https://cruscotto-italia.dati.gov.it/",
    licenza: "prevalentemente CC BY 4.0",
    nota: "KPI comunali (demografia, economia, scuole, finanza SIOPE, PNRR, turismo ISTAT, territorio, …) filtrati per codice ISTAT.",
  },
  {
    nome: "OpenStreetMap / Overpass / CARTO",
    ente: "OpenStreetMap contributors",
    ambito: "nazionale",
    url: "https://www.openstreetmap.org/copyright",
    licenza: "ODbL",
    nota: "Mappe, civici, percorsi ciclo/sentieri, farmacie georeferenziate, TPL fermate.",
  },
  {
    nome: "Open-Meteo + RainViewer + ItaliaMeteo",
    ente: "Open-Meteo / RainViewer / ItaliaMeteo",
    ambito: "nazionale",
    url: "https://open-meteo.com/",
    licenza: "open (vedi siti)",
    nota: "Meteo live, previsioni, radar. OpenWeather è opzionale (API key).",
  },
  {
    nome: "Allerte Protezione Civile",
    ente: "allertameteo.app / DPC",
    ambito: "nazionale",
    feature: "allerte",
    url: "https://allertameteo.app/",
    licenza: "dati pubblici",
    nota: "Allerte meteo-idro per nome comune. Le mappe SIR regionali (es. Toscana) sono un modulo a parte.",
  },
  {
    nome: "Catasto rifiuti ISPRA",
    ente: "ISPRA",
    ambito: "nazionale",
    feature: "rifiuti_ispra",
    url: "https://www.catasto-rifiuti.isprambiente.it/",
    licenza: "open data",
    nota: "CSV nazionale, filtro ISTAT. Il calendario del gestore locale resta un link HTML.",
  },
  {
    nome: "OMI — quotazioni immobiliari",
    ente: "Agenzia delle Entrate",
    ambito: "nazionale",
    url: "https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/omi",
    licenza: "riuso con attribuzione; mirror ondata",
    nota: "Snapshot locale `src/data/omi/{ISTAT}.json` via `npm run omi:update`.",
  },
  {
    nome: "Scuole MIUR",
    ente: "Ministero dell’Istruzione",
    ambito: "nazionale",
    url: "https://dati.istruzione.it/opendata/",
    licenza: "open data",
    nota: "Serve il codice catastale del comune in `miur_codice_catastale`.",
  },
  {
    nome: "Farmacie di turno",
    ente: "farmaciediturno.org",
    ambito: "nazionale",
    url: "https://www.farmaciediturno.org/",
    licenza: "sito pubblico",
    nota: "Codice = ISTAT senza lo zero iniziale (`farmacie_di_turno_cod`).",
  },
  {
    nome: "DAE / OpenAEDMap",
    ente: "OpenStreetMap / OpenAEDMap",
    ambito: "nazionale",
    feature: "dae",
    url: "https://openaedmap.org/",
    licenza: "ODbL",
    nota: "`npm run dae:sync` esporta i defibrillatori nel bbox. Il bot Telegram è opzionale.",
  },
  {
    nome: "Colonnine EV e carburanti",
    ente: "OpenChargeMap / PUN / MIMIT",
    ambito: "nazionale",
    url: "https://www.piattaformaunicanazionale.it/idr",
    licenza: "open / parziale",
    nota: "Prezzi EV indicativi. Carburanti da anagrafe MIMIT.",
  },
  {
    nome: "DoveVannoINostriSoldi (IRPEF / OpenCivitas)",
    ente: "dovevannoinostrisoldi.com",
    ambito: "nazionale",
    feature: "finanza_dvns",
    url: "https://www.dovevannoinostrisoldi.com/",
    licenza: "API read-only (il loro codice è AGPL-3.0)",
    nota: "Non sostituisce il SIOPE AgID. Filtro ISTAT.",
  },
  {
    nome: "ViaggiaTreno",
    ente: "RFI / Trenitalia",
    ambito: "opzionale",
    feature: "treni",
    url: "https://www.viaggiatreno.it/",
    licenza: "API pubblica non ufficiale",
    nota: "Richiede `ferrovie.stazione_viaggiatreno`. Spegnere se non c’è stazione FS.",
  },
  {
    nome: "GTFS TPL regionale",
    ente: "Regione / gestore TPL",
    ambito: "opzionale",
    feature: "gtfs_locale",
    url: "https://www.dati.gov.it/",
    licenza: "dipende dal dataset",
    nota: "Non copiare i path Toscana. Imposta `regione_opendata.gtfs_*` e `npm run trasporti:gtfs`.",
  },
  {
    nome: "Porto, webcam, AIS",
    ente: "Comune / VesselFinder",
    ambito: "opzionale",
    feature: "porto",
    url: "https://www.vesselfinder.com/",
    licenza: "embed VesselFinder + immagini comunali",
    nota: "Solo comuni costieri con porto. Webcam: `porto.webcam_page` / `webcam_base`.",
  },
  {
    nome: "Balneazione / qualità acque di bagno",
    ente: "ARPA regionale",
    ambito: "opzionale",
    feature: "balneazione",
    url: "https://www.salute.gov.it/portale/temi/p2_6.jsp?id=4073",
    licenza: "open data regionali",
    nota: "Non riusare le spiagge di un altro comune. Configura la fonte della tua Regione.",
  },
  {
    nome: "Erosione costiera IdroGEO",
    ente: "ISPRA IdroGEO",
    ambito: "opzionale",
    feature: "erosione_costiera",
    url: "https://idrogeo.isprambiente.it/",
    licenza: "open",
    nota: "WFS dinamica litoranea. Off per comuni interni.",
  },
  {
    nome: "Acqua / servizio idrico (WFS gestore)",
    ente: "Gestore SII",
    ambito: "opzionale",
    feature: "acqua_sii",
    url: "https://www.autoritaidrica.toscana.it/",
    licenza: "dipende dal gestore",
    nota: "Il WFS etichette/fontanelle non è universale. Fuori da quell’ambito: flag false e link al gestore.",
  },
  {
    nome: "Eventi comunali / regionali",
    ente: "Sito comunale / CKAN regionale",
    ambito: "opzionale",
    feature: "eventi_comune",
    url: "https://www.dati.gov.it/",
    licenza: "dipende",
    nota: "Scrape o CKAN. `eventi_calendario_kind` e `eventi_filtro_extra` nel JSON.",
  },
  {
    nome: "Allerte regionali (es. SIR Toscana)",
    ente: "Centro Funzionale Regionale",
    ambito: "opzionale",
    feature: "allerte_toscana_sir",
    url: "https://www.protezionecivile.gov.it/",
    licenza: "dati pubblici",
    nota: "Solo se la tua Regione pubblica mappe analoghe. Fuori Toscana lascia false.",
  },
];
