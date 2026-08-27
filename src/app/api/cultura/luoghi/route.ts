import { NextResponse } from "next/server";
import { COMUNE_ISTAT_CULTURA, COMUNE_NOME } from "@/lib/constants";

const CACHE_DURATION = 86400;

export async function GET() {
  return NextResponse.json(
    {
      comune: COMUNE_NOME,
      istat: COMUNE_ISTAT_CULTURA,
      n_luoghi: 0,
      luoghi: [],
      fonte: {
        nome: "Ministero della Cultura",
        url: "https://dati.beniculturali.it/",
        api: "https://opendata.beniculturali.it/",
        licenza: "CC-BY 4.0",
      },
      note: "Nessun elenco hardcoded. I beni culturali georeferenziati arrivano dal MCP AgID (mappa). Aggiungi luoghi locali in un overlay del fork se serve.",
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    },
  );
}
