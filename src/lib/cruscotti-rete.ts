/**
 * Rete dei cruscotti comunali già online o in lavorazione.
 * Aggiornare qui quando nasce un nuovo fork pubblico.
 */

export type CruscottoStatus = "online" | "in_sviluppo";

export type CruscottoRete = {
  id: string;
  nome: string;
  provincia: string;
  regione: string;
  istat: string;
  url: string;
  status: CruscottoStatus;
  ordine: number;
  tagline: string;
  note: string;
  /** Primo cruscotto da cui è nato il template. */
  origin?: boolean;
};

export const CRUSCOTTI_RETE: CruscottoRete[] = [
  {
    id: "san-vincenzo",
    nome: "San Vincenzo",
    provincia: "LI",
    regione: "Toscana",
    istat: "049018",
    url: "https://www.cruscottosanvincenzo.it",
    status: "online",
    ordine: 1,
    origin: true,
    tagline: "Il primo cruscotto: costa livornese, porto e dati aperti AgID.",
    note: "Progetto originale di Alessandro Cipriani. Farmacie, DAE, treni, meteo, finanza e moduli locali (porto, balneazione, bot Telegram).",
  },
  {
    id: "campiglia-marittima",
    nome: "Campiglia Marittima",
    provincia: "LI",
    regione: "Toscana",
    istat: "049002",
    url: "https://www.cruscottocampigliamarittima.it",
    status: "online",
    ordine: 2,
    tagline: "Il secondo cruscotto, sulla Costa degli Etruschi.",
    note: "Stesso modello, adattato al Comune di Campiglia Marittima: KPI nazionali, servizi utili e sezioni territoriali.",
  },
  {
    id: "bibbiena",
    nome: "Bibbiena",
    provincia: "AR",
    regione: "Toscana",
    istat: "051004",
    url: "https://bibbiena-cruscotto.vercel.app/",
    status: "in_sviluppo",
    ordine: 3,
    tagline: "Fork in lavorazione nel Casentino, ancora su anteprima Vercel.",
    note: "Comune interno (niente porto né balneazione). L’indirizzo attuale è una preview: il dominio definitivo arriverà a lavoro finito.",
  },
];

export function cruscottiOnline(): CruscottoRete[] {
  return CRUSCOTTI_RETE.filter((c) => c.status === "online");
}

export function cruscottiInSviluppo(): CruscottoRete[] {
  return CRUSCOTTI_RETE.filter((c) => c.status === "in_sviluppo");
}
