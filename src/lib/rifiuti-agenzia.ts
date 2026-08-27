/**
 * Agenzia regionale rifiuti: risolve l’URL del file dalla pagina indice.
 */
import { COMUNE, isFeatureEnabled, matchesComuneText } from "@/lib/comune-config";
import { fetchUa } from "@/lib/http-ua";

export type RifiutiAgenziaData = {
  nome: string;
  pagina: string;
  fileUrl: string | null;
  rdPct: number | null;
  anno: number | null;
  note: string | null;
};

export async function buildRifiutiAgenzia(): Promise<RifiutiAgenziaData> {
  const ag = COMUNE.gestori.rifiuti.agenzia_regionale;
  const empty = (note: string): RifiutiAgenziaData => ({
    nome: ag.nome,
    pagina: ag.pagina_indice,
    fileUrl: null,
    rdPct: null,
    anno: null,
    note,
  });
  if (!isFeatureEnabled("rifiuti_agenzia_regionale")) {
    return empty("Modulo spento (features.rifiuti_agenzia_regionale).");
  }
  if (!ag.pagina_indice) {
    return empty("Manca gestori.rifiuti.agenzia_regionale.pagina_indice.");
  }
  const res = await fetchUa(ag.pagina_indice, { timeoutMs: 25_000 });
  if (!res.ok) {
    return empty(`Pagina indice ${res.status}.`);
  }
  const html = await res.text();
  const pattern = ag.pattern_file || "\\.xlsx?";
  const re = new RegExp(
    `href=["']([^"']*${pattern}[^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  let fileUrl = m?.[1] ?? null;
  if (fileUrl && fileUrl.startsWith("/")) {
    try {
      fileUrl = new URL(fileUrl, ag.pagina_indice).href;
    } catch {
      /* keep */
    }
  }
  // Heuristica: percentuale RD citata nella pagina accanto al nome comune
  let rdPct: number | null = null;
  let anno: number | null = null;
  const nome = COMUNE.nome;
  const idx = html.toLowerCase().indexOf(nome.toLowerCase());
  if (idx >= 0) {
    const slice = html.slice(idx, idx + 800);
    const pct = slice.match(/(\d{1,2}[.,]\d{1,2})\s*%/);
    if (pct) rdPct = Number(pct[1].replace(",", "."));
    const y = slice.match(/20\d{2}/);
    if (y) anno = Number(y[0]);
  }
  if (rdPct == null && matchesComuneText(html.slice(0, 500))) {
    /* pagina pertinente ma senza % accanto al nome */
  }
  return {
    nome: ag.nome,
    pagina: ag.pagina_indice,
    fileUrl,
    rdPct,
    anno,
    note: fileUrl
      ? "URL del file risolto dalla pagina indice (non è in configurazione)."
      : "Nessun file XLS/XLSX trovato nella pagina indice.",
  };
}
