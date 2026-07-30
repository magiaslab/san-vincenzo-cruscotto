/**
 * Rigenera modal_rag/corpus a partire da Cruscotto Italia MCP + testi del sito.
 * Uso: node modal_rag/build_corpus.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "corpus");

async function callTool(name, args) {
  const transport = new StreamableHTTPClientTransport(
    new URL("https://cruscotto-italia-mcp.agid.workers.dev/mcp"),
  );
  const client = new Client({ name: "corpus-builder", version: "1.0.0" });
  await client.connect(transport);
  try {
    const result = await client.callTool({ name, arguments: args });
    const text = (result.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("");
    return JSON.parse(text);
  } finally {
    await client.close();
  }
}

function write(name, title, body) {
  fs.writeFileSync(
    path.join(out, name),
    `# ${title}\n\n${String(body).trim()}\n`,
    "utf8",
  );
}

fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) {
  if (f.endsWith(".md")) fs.unlinkSync(path.join(out, f));
}

const kpi = await callTool("comune_kpi", { istat_code: "049018" });
const dash = await callTool("comune_dashboard", { istat_code: "049018" });

write(
  "01_comune.md",
  "Comune di San Vincenzo",
  `San Vincenzo è un comune della provincia di Livorno, in Toscana (Italia).
Codice ISTAT: 049018.
Il Cruscotto San Vincenzo è una dashboard indipendente e non ufficiale che mostra dati aperti del comune, alimentata da Cruscotto Italia (AgID).
Autore: Alessandro Cipriani.`,
);

write(
  "02_progetto.md",
  "Come funziona il cruscotto",
  `Tab: Panoramica, Turismo, Porto, Economia, Finanza, Territorio, Ambiente, Mobilità, Sanità, Meteo, Mappa, Assistente.
API: /api/kpi, /api/dettaglio, /api/mappa, /api/meteo, /api/assistente.
Mobilità: mappe Leaflet EV (PUN) e carburanti (MIMIT), indicatori FTTH AGCOM.
Porto: webcam comunali + embed AIS VesselFinder.
Meteo: ItaliaMeteo + Open-Meteo + radar RainViewer.`,
);

let n = 0;
for (const [key, val] of Object.entries(kpi)) {
  if (!val || typeof val !== "object" || key.startsWith("_")) continue;
  write(
    `kpi_${String(n).padStart(2, "0")}_${key}.md`,
    key,
    `Sezione KPI \`${key}\` per San Vincenzo.\n\n\`\`\`json\n${JSON.stringify(val, null, 2).slice(0, 4000)}\n\`\`\``,
  );
  n += 1;
}

const pun = dash.pun;
if (pun?.kpi) {
  write(
    "30_ev_pun.md",
    "Colonnine di ricarica EV",
    `A San Vincenzo ci sono ${pun.kpi.n_totale} punti di ricarica EV (PUN/IDR), di cui ${pun.kpi.n_attivi} attivi (${pun.kpi.pct_attivi}%).
Potenza totale circa ${pun.kpi.potenza_tot_kw} kW. Mix: ${JSON.stringify(pun.kpi.mix_potenza)}.
CPO: ${(pun.kpi.cpo_list || []).join(", ")}.`,
  );
}

const agcom = dash.agcom_bbmap;
if (agcom?.kpi) {
  write(
    "31_banda.md",
    "Copertura banda ultralarga",
    `FTTH DESI: ${agcom.kpi.copertura_ftth_desi_pct}%. FTTH 20m: ${agcom.kpi.copertura_ftth_20m_pct}%.
Famiglie: ${agcom.kpi.famiglie_residenti}; con FTTH: ${agcom.kpi.famiglie_ftth}.
Fonte AGCOM Broadband Map.`,
  );
}

const carb = dash.carburanti;
if (carb?.punti?.length) {
  const lines = carb.punti
    .slice(0, 15)
    .map(
      (p) =>
        `- ${p.name} (${p.brand}): benzina self ${p.prezzi?.benzina_self ?? "n.d."}, gasolio self ${p.prezzi?.gasolio_self ?? "n.d."} — ${p.indirizzo || ""}`,
    )
    .join("\n");
  write(
    "32_carburanti.md",
    "Impianti carburanti",
    `Impianti MIMIT: ${carb.kpi?.n_impianti ?? carb.punti.length}.\n${lines}`,
  );
}

write(
  "36_porto.md",
  "Porto turistico",
  `Capienza del porto di San Vincenzo: circa 140 posti barca.
Sezione del cruscotto: Porto — apri /#porto
Porto/approdo turistico comunale sulla Costa degli Etruschi.
Webcam: https://lnx.comune.sanvincenzo.li.it/webcam/
AIS: embed VesselFinder gratuito.`,
);

write(
  "37_fonti.md",
  "Fonti open data",
  `Cruscotto Italia (AgID), OpenStreetMap, Open-Meteo, RainViewer, PUN/IDR, MIMIT, AGCOM, ARPAT, dati.toscana.it, MiC, Comune di San Vincenzo.`,
);

console.log(`Corpus aggiornato: ${fs.readdirSync(out).length} file in ${out}`);
