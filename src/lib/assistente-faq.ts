/**
 * FAQ locale: risposta deterministica (dato o link sezione) senza LLM.
 * Copre tutte le sezioni del cruscotto, non solo il porto.
 */

import { COMUNE_NOME } from "@/lib/constants";

export type FaqHit = {
  answer: string;
  link: { href: string; label: string };
  sources: Array<{
    title: string;
    source: string;
    score: number;
    excerpt: string;
  }>;
};

type Rule = {
  id: string;
  patterns: RegExp[];
  answer: string;
  href: string;
  label: string;
  title: string;
};

const RULES: Rule[] = [
  // —— Porto ——
  {
    id: "porto-capienza",
    patterns: [
      /capienza.*porto|posti\s*barca|quanti\s*posti.*porto|porto.*posti|ormeggi/i,
    ],
    answer: `Capienza del porto di ${COMUNE_NOME}: circa 140 posti barca (ISTAT / OpenDataComune).`,
    href: "/#porto",
    label: "Apri sezione Porto",
    title: "Porto turistico",
  },
  {
    id: "porto-passeggeri",
    patterns: [/passeggeri.*porto|porto.*passeggeri|traffico\s*navale|crociere|movimento\s*passeggeri/i],
    answer:
      "Movimento passeggeri e traffico navale (serie ISTAT) sono nella sezione Porto.",
    href: "/#porto",
    label: "Apri sezione Porto",
    title: "Porto turistico",
  },
  {
    id: "porto-webcam",
    patterns: [/webcam.*porto|traffico\s*ais|sezione\s*porto|cosa\s+mostra.*porto/i],
    answer:
      "Nella sezione Porto trovi posti barca (~140), servizi, webcam comunali e mappa AIS VesselFinder.",
    href: "/#porto",
    label: "Apri sezione Porto",
    title: "Porto turistico",
  },

  // —— Mobilità / EV / FTTH / carburanti / TPL ——
  {
    id: "ev",
    patterns: [
      /colonnin|ricarica\s*ev|\bev\b|punti\s*di\s*ricarica|pun\/idr|auto\s*elettric|veicol[ei]\s*elettric/i,
    ],
    answer:
      "Punti di ricarica EV: 38 totali (33 attivi), potenza complessiva circa 1.408 kW. Gestori e prezzi indicativi (€/kWh) sono nella sezione Mobilità: verifica sempre sull’app del gestore.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Colonnine EV",
  },
  {
    id: "ev-prezzi",
    patterns: [/prezzo.*ricaric|costo.*ricaric|tariffa.*colonnin|€\s*\/\s*kwh|euro\s*kwh|prezzi\s*ev|gestore.*colonnin/i],
    answer:
      "I prezzi €/kWh delle colonnine sono parziali e indicativi (PienoFurbo / OpenChargeMap). In Mobilità trovi la tabella gestori/prezzi: conferma sempre su fonti ufficiali o app del gestore.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Prezzi ricarica EV",
  },
  {
    id: "ftth",
    patterns: [/ftth|banda\s*(larga|ultralarga)|copertura\s*fibra|fibra\s*ottic|\bdesi\b|agcom/i],
    answer:
      "Copertura FTTH AGCOM: DESI circa 56%, copertura a 20 Mbit/s circa 39%. Dettaglio in Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Banda ultralarga",
  },
  {
    id: "carburanti",
    patterns: [/carburant|benzina|gasolio|prezzo.*carbur|impianti\s*carbur|distributori/i],
    answer:
      "7 impianti carburanti. Prezzi medi self: benzina ~1,971 €/L, gasolio ~2,016 €/L (MIMIT). Tabella e mappa in Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Carburanti",
  },
  {
    id: "trasporti",
    patterns: [
      /trasport|autobus|\bbus\b|autolinee|fermata|treno|trenitalia|stazione\s*fs|gtfs|\btpl\b|ciclabil|pedonal|sentieri/i,
    ],
    answer:
      "Orari Autolinee Toscana e Trenitalia (GTFS). Percorsi ciclabili e pedonali da OpenStreetMap (lista, mappa, GPX) in Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Trasporti",
  },
  {
    id: "pendolarismo",
    patterns: [/pendolar|spostamenti\s*casa|auto[- ]?contenimento|autocontenimento/i],
    answer:
      "Pendolarismo ISTAT: saldo circa −46, auto-contenimento circa 48,3%. Dettaglio in Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Pendolarismo",
  },
  {
    id: "veicoli",
    patterns: [/parco\s*veicol|tasso\s*di\s*motorizzaz|motorizzazion|veicoli\s*circolant|\baci\b.*veicol/i],
    answer:
      "Parco veicolare ACI: circa 6.518 veicoli, motorizzazione circa 686 ogni 1.000 abitanti. Grafici in Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Parco veicolare",
  },
  {
    id: "mobilita-generale",
    patterns: [/mobilit[aà]|infrastruttur/i],
    answer:
      "Carburanti, EV, FTTH, TPL, ciclabili/pedonali e parco veicolare sono nella sezione Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Mobilità",
  },

  // —— Panoramica / demografia ——
  {
    id: "popolazione",
    patterns: [/popolazione|abitanti|quanti\s*abitanti|residenti|demografia/i],
    answer:
      "Popolazione residente: 6.342 abitanti (ISTAT). Serie storiche nella sezione Panoramica.",
    href: "/#panoramica",
    label: "Apri sezione Panoramica",
    title: "Demografia",
  },
  {
    id: "demografia-extra",
    patterns: [/nascite|decessi|saldo\s*naturale|migrazion|stranieri/i],
    answer:
      "Nascite, decessi, saldo naturale/migratorio e stranieri sono nella sezione Panoramica.",
    href: "/#panoramica",
    label: "Apri sezione Panoramica",
    title: "Demografia",
  },
  {
    id: "panoramica",
    patterns: [/panoramica|quadro\s*generale|sintesi\s*comunale|overview/i],
    answer: "Il quadro generale del comune è nella sezione Panoramica.",
    href: "/#panoramica",
    label: "Apri sezione Panoramica",
    title: "Panoramica",
  },

  // —— Turismo ——
  {
    id: "turismo-kpi",
    patterns: [
      /strutture\s*ricettiv|capacit[aà]\s*ricettiv|letti\s*turistic|indice\s*turistic|densit[aà]\s*turistic/i,
    ],
    answer:
      "Turismo: 203 strutture ricettive, 14.368 letti, indice di densità turistica circa 226,6. Dettaglio in Turismo.",
    href: "/#turismo",
    label: "Apri sezione Turismo",
    title: "Turismo",
  },
  {
    id: "turismo",
    patterns: [
      new RegExp(
        `turist|eventi|biblioteca|visit\\s*${COMUNE_NOME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*")}|arrivi|presenze|alberghi|\\bhotel\\b`,
        "i",
      ),
    ],
    answer:
      "Turismo (arrivi/presenze, strutture, eventi, biblioteca) è nella sezione Turismo.",
    href: "/#turismo",
    label: "Apri sezione Turismo",
    title: "Turismo",
  },

  // —— Economia ——
  {
    id: "imprese",
    patterns: [/imprese|unit[aà]\s*locali|\basia\b|aziende|addetti|occupazione/i],
    answer:
      "Economia: circa 697 unità locali (ASIA). Imprese e occupazione nella sezione Economia.",
    href: "/#economia",
    label: "Apri sezione Economia",
    title: "Economia",
  },
  {
    id: "reddito",
    patterns: [/reddito\s*medio|redditi\s*mef|\birpef\b|dichiarato/i],
    answer:
      "Reddito medio dichiarato MEF: circa 24.497 €. Serie e dettaglio in Economia / Finanza.",
    href: "/#economia",
    label: "Apri sezione Economia",
    title: "Redditi",
  },
  {
    id: "pnrr",
    patterns: [/\bpnrr\b|progetti\s*pnrr|fondi\s*pnrr/i],
    answer:
      "PNRR: 14 progetti per circa 700.391 € di finanziamento. Elenco in Economia / Finanza.",
    href: "/#economia",
    label: "Apri sezione Economia",
    title: "PNRR",
  },
  {
    id: "economia",
    patterns: [/economia\s*locale|sezione\s*economia/i],
    answer: "Imprese, reddito e PNRR sono nella sezione Economia.",
    href: "/#economia",
    label: "Apri sezione Economia",
    title: "Economia",
  },

  // —— Finanza ——
  {
    id: "finanza-siope",
    patterns: [/siope|bilancio\s*comunale|uscite\s*comunali|entrate\s*comunali|incassi\s*comunali/i],
    answer:
      "SIOPE 2025 (annualizzato): uscite circa 20,6 M€, incassi circa 22,0 M€. Dettaglio in Finanza.",
    href: "/#finanza",
    label: "Apri sezione Finanza",
    title: "Finanza",
  },
  {
    id: "finanza",
    patterns: [/finanza|spesa\s*pubblica|bilancio/i],
    answer: "Finanza pubblica (SIOPE, PNRR, redditi) è nella sezione Finanza.",
    href: "/#finanza",
    label: "Apri sezione Finanza",
    title: "Finanza",
  },

  // —— Ambiente ——
  {
    id: "ambiente-kpi",
    patterns: [
      /raccolta\s*differenziat|rifiuti\s*pro\s*capite|consumo\s*(di\s*)?suolo|riciclo/i,
    ],
    answer:
      "Ambiente: RD ISPRA (Catasto rifiuti) e, se disponibili, stime del gestore (SEI). Dettaglio frazioni e serie in Ambiente.",
    href: "/#rifiuti-ispra",
    label: "Apri rifiuti ISPRA",
    title: "Rifiuti",
  },
  {
    id: "acqua-sii",
    patterns: [
      /acqua\s*potabile|etichett[ae]\s*(dell['’])?acqua|fontanell|acquedott|\basa\b|servizio\s*idrico|qualit[aà]\s*(dell['’])?acqua/i,
    ],
    answer:
      "Acqua potabile: etichette e fontanelle del gestore (ASA, WFS della mappa pubblica). Qualità tecnica regionale (RQTII) è su AIT a scala di gestore. Dettaglio in Ambiente.",
    href: "/#servizio-idrico",
    label: "Apri servizio idrico",
    title: "Acqua potabile",
  },
  {
    id: "ambiente",
    patterns: [
      /balneaz|arpat|rifiuti|qualit[aà]\s*(dell['’])?aria|\bpm10\b|\bpm2\.?5\b|\bco2\b|emissioni|ambiente/i,
    ],
    answer:
      "Balneazione ARPAT, aria, rifiuti ISPRA, acqua potabile (gestore SII) e suolo sono nella sezione Ambiente.",
    href: "/#ambiente",
    label: "Apri sezione Ambiente",
    title: "Ambiente",
  },

  // —— Sanità ——
  {
    id: "farmacie",
    patterns: [/farmacie?|parafarmac|quante\s*farmacie|farmacie?\s*(di\s*)?turno/i],
    answer:
      "Sanità: 2 farmacie e 1 parafarmacia. Turni e mappa nella sezione Sanità.",
    href: "/#sanita",
    label: "Apri sezione Sanità",
    title: "Sanità",
  },
  {
    id: "sanita",
    patterns: [/dae|defibrillat|ospedal|sanit[aà]|salute|medico/i],
    answer: "DAE, farmacie e indicatori sanitari sono nella sezione Sanità.",
    href: "/#sanita",
    label: "Apri sezione Sanità",
    title: "Sanità",
  },

  // —— Istruzione / Società ——
  {
    id: "scuole",
    patterns: [/scuol|miur|alunni|plessi|istruzione|studenti|asili/i],
    answer: "Scuole MIUR e istruzione sono nella sezione Istruzione.",
    href: "/#istruzione",
    label: "Apri sezione Istruzione",
    title: "Istruzione",
  },
  {
    id: "societa",
    patterns: [/societ[aà]|servizi\s*sociali|anziani|welfare|assegno/i],
    answer: "Indicatori sociali e welfare sono nella sezione Società.",
    href: "/#societa",
    label: "Apri sezione Società",
    title: "Società",
  },
  {
    id: "disabilita",
    patterns: [
      /disabilit|accessibilit[aà]|barriere|wheelchair|stalli\s*disabil|bagno\s*accessibil|peba|carrozzin|inclusione/i,
    ],
    answer:
      "Luoghi accessibili, stalli e bagni (OpenStreetMap/Wheelmap) e enti del terzo settore sono nella sezione Disabilità. I dati OSM sono volontari: verifica sempre sulle fonti ufficiali.",
    href: "/#disabilita",
    label: "Apri sezione Disabilità",
    title: "Disabilità",
  },
  {
    id: "partecipa",
    patterns: [
      /suggeriment|feedback|segnala(re)?\s*(un\s*)?(problema|bug|migliorament)|partecip|github\s*issue|proposta/i,
    ],
    answer:
      "Puoi proporre miglioramenti nella sezione Partecipa: il form apre una issue su GitHub.",
    href: "/#partecipa",
    label: "Apri sezione Partecipa",
    title: "Partecipa",
  },
  {
    id: "sostieni",
    patterns: [
      /sostien|donazion|buy\s*me\s*a\s*coffee|\bbmc\b|caff[eè]|hosting|ringraziament|supporter/i,
    ],
    answer:
      "Il cruscotto è un progetto indipendente senza budget pubblico. Puoi coprire hosting e compute con un caffè su Buy Me a Coffee: i ringraziamenti pubblici sono in Sostieni.",
    href: "/sostieni",
    label: "Apri pagina Sostieni",
    title: "Sostieni",
  },

  // —— Territorio / Mappa ——
  {
    id: "territorio",
    patterns: [/territorio|superficie|ettari|confini|uso\s*del\s*suolo/i],
    answer: "Dati territoriali e uso del suolo sono nella sezione Territorio.",
    href: "/#territorio",
    label: "Apri sezione Territorio",
    title: "Territorio",
  },
  {
    id: "mappa",
    patterns: [/mappa\s*(del\s*)?comune|catasto|civici|rilievo\s*3d|cartografia|mappa\s*interattiva/i],
    answer: "Mappa comunale, catasto e civici sono nella sezione Mappa.",
    href: "/#mappa",
    label: "Apri sezione Mappa",
    title: "Mappa",
  },

  // —— Meteo ——
  {
    id: "meteo-allerte",
    patterns: [/allerta|protezione\s*civile|criticit[aà]|bollettino\s*meteo/i],
    answer:
      `Allerte Protezione Civile per ${COMUNE_NOME} nel tab Meteo.`,
    href: "/#meteo",
    label: "Apri sezione Meteo",
    title: "Allerte meteo",
  },
  {
    id: "meteo",
    patterns: [/meteo|temperatura|vento|radar|precipitaz|previsioni|tempo\s*oggi|pioggia/i],
    answer:
      "Condizioni live (OpenWeather), previsioni, qualità aria e allerte sono nella sezione Meteo.",
    href: "/#meteo",
    label: "Apri sezione Meteo",
    title: "Meteo",
  },

  // —— Catch-all porto (dopo le altre sezioni) ——
  {
    id: "porto-generale",
    patterns: [/\bporto\b/i],
    answer:
      "Nella sezione Porto trovi posti barca (~140), servizi, webcam comunali e mappa AIS VesselFinder.",
    href: "/#porto",
    label: "Apri sezione Porto",
    title: "Porto turistico",
  },
];

export function matchFaq(question: string): FaqHit | null {
  const q = question.trim();
  if (!q) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(q))) {
      return {
        answer: rule.answer,
        link: { href: rule.href, label: rule.label },
        sources: [
          {
            title: rule.title,
            source: `faq:${rule.id}`,
            score: 1,
            excerpt: rule.answer,
          },
        ],
      };
    }
  }
  return null;
}
