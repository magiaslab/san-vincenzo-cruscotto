/**
 * Risposte deterministiche per domande frequenti sul cruscotto.
 * Preferisce il dato numerico/testuale o il link alla sezione — niente prose inventata.
 */

export type FaqHit = {
  answer: string;
  link: { href: string; label: string };
  sources: Array<{ title: string; source: string; score: number; excerpt: string }>;
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
  {
    id: "porto-capienza",
    patterns: [
      /capienza.*porto|posti\s*barca|quanti\s*posti.*porto|porto.*posti|ormeggi/i,
    ],
    answer: "Capienza del porto di San Vincenzo: circa 140 posti barca.",
    href: "/#porto",
    label: "Apri sezione Porto",
    title: "Porto turistico",
  },
  {
    id: "porto-generale",
    patterns: [/sezione\s*porto|cosa\s+mostra.*porto|webcam.*porto|traffico\s*ais/i],
    answer:
      "Nella sezione Porto trovi posti barca (~140), servizi, webcam comunali e mappa AIS VesselFinder.",
    href: "/#porto",
    label: "Apri sezione Porto",
    title: "Porto turistico",
  },
  {
    id: "ev",
    patterns: [/colonnin|ricarica\s*ev|\bev\b|punti\s*di\s*ricarica|pun\/idr/i],
    answer:
      "I punti di ricarica EV (PUN/IDR) sono nella sezione Mobilità, con mappa e KPI aggiornati.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Colonnine EV",
  },
  {
    id: "ftth",
    patterns: [/ftth|banda\s*(larga|ultralarga)|copertura\s*fibra|agcom/i],
    answer:
      "La copertura FTTH AGCOM è riportata nei KPI della sezione Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Banda ultralarga",
  },
  {
    id: "carburanti",
    patterns: [/carburant|benzina|gasolio|prezzo.*carbur|impianti\s*carbur/i],
    answer:
      "Prezzi e impianti carburanti (MIMIT) sono in cima alla sezione Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Carburanti",
  },
  {
    id: "meteo-allerte",
    patterns: [/allerta|protezione\s*civile|criticità|bollettino\s*meteo/i],
    answer:
      "Le allerte Protezione Civile per San Vincenzo (zona Etruria-Costa Nord) sono nel tab Meteo.",
    href: "/#meteo",
    label: "Apri sezione Meteo",
    title: "Allerte meteo",
  },
  {
    id: "meteo",
    patterns: [/meteo|temperatura|vento|radar|precipitaz/i],
    answer:
      "Condizioni live, previsioni, qualità aria e radar sono nella sezione Meteo.",
    href: "/#meteo",
    label: "Apri sezione Meteo",
    title: "Meteo",
  },
  {
    id: "farmacie",
    patterns: [/farmacie?\s*(di\s*)?turno|parafarmac/i],
    answer:
      "Farmacie di turno e mappa punti sanitari sono nella sezione Sanità.",
    href: "/#sanita",
    label: "Apri sezione Sanità",
    title: "Sanità",
  },
  {
    id: "sanita",
    patterns: [/dae|defibrillat|ospedal|sanità|sanita/i],
    answer: "DAE, farmacie e indicatori sanitari sono nella sezione Sanità.",
    href: "/#sanita",
    label: "Apri sezione Sanità",
    title: "Sanità",
  },
  {
    id: "turismo",
    patterns: [/turist|eventi|biblioteca|visit\s*san\s*vincenzo|arrivi|presenze/i],
    answer:
      "Turismo, eventi comunali e biblioteca sono nella sezione Turismo.",
    href: "/#turismo",
    label: "Apri sezione Turismo",
    title: "Turismo",
  },
  {
    id: "trasporti",
    patterns: [
      /trasport|autobus|autolinee|fermata|treno|stazione\s*fs|ciclabil|pedonal/i,
    ],
    answer:
      "Fermate/linee Autolinee Toscane, partenze FS, ciclabili e pedonali sono nella sezione Mobilità.",
    href: "/#infra",
    label: "Apri sezione Mobilità",
    title: "Trasporti",
  },
  {
    id: "ambiente",
    patterns: [/balneaz|arpat|rifiuti|raccolta\s*differenziat|qualità\s*(dell['’])?aria|suolo/i],
    answer:
      "Balneazione ARPAT, aria, rifiuti e suolo sono nella sezione Ambiente.",
    href: "/#ambiente",
    label: "Apri sezione Ambiente",
    title: "Ambiente",
  },
  {
    id: "finanza",
    patterns: [/siope|pnrr|bilancio|finanza|entrate|uscite|redditi\s*mef/i],
    answer: "Finanza pubblica (SIOPE, PNRR, redditi) è nella sezione Finanza.",
    href: "/#finanza",
    label: "Apri sezione Finanza",
    title: "Finanza",
  },
  {
    id: "scuole",
    patterns: [/scuol|miur|alunni|plessi|istruzione/i],
    answer: "Scuole MIUR e istruzione sono nella sezione Istruzione.",
    href: "/#istruzione",
    label: "Apri sezione Istruzione",
    title: "Istruzione",
  },
  {
    id: "mappa",
    patterns: [/mappa\s*(del\s*)?comune|catasto|civici|rilievo\s*3d/i],
    answer: "Mappa comunale, catasto e civici sono nella sezione Mappa.",
    href: "/#mappa",
    label: "Apri sezione Mappa",
    title: "Mappa",
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
