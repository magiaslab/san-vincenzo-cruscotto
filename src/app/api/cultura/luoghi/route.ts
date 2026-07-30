import { NextResponse } from "next/server";
import { COMUNE_ISTAT_CULTURA } from "@/lib/constants";

const CACHE_DURATION = 86400; // 24 ore

function mapsUrl(query: string, lat?: number, lon?: number): string {
  if (lat != null && lon != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export async function GET() {
  try {
    const luoghi = [
      {
        nome: "Torre di San Vincenzo",
        tipo: "Monumento",
        tipologia: "Torre costiera medioevale",
        secolo: "XV secolo",
        stato: "Restaurato",
        visitabile: true,
        note: "Torre costiera del XV secolo, simbolo del comune",
        lat: 43.10035,
        lon: 10.5388,
        sito: null as string | null,
        maps_url: mapsUrl("Torre di San Vincenzo, San Vincenzo LI", 43.10035, 10.5388),
      },
      {
        nome: "Parco Archeologico di Baratti e Populonia",
        tipo: "Area archeologica",
        tipologia: "Sito archeologico etrusco",
        periodo: "Etrusco-Romano",
        stato: "Aperto al pubblico",
        visitabile: true,
        note: "Necropoli e resti della città etrusca di Populonia (Piombino), a pochi km",
        lat: 42.9895,
        lon: 10.4992,
        sito: "https://www.parchivaldicornia.it/parco-archeologico-di-baratti-e-populonia/",
        maps_url: mapsUrl(
          "Parco Archeologico di Baratti e Populonia",
          42.9895,
          10.4992,
        ),
      },
      {
        nome: "Museo Archeologico del Territorio di Populonia",
        tipo: "Museo",
        tipologia: "Museo archeologico",
        stato: "Attivo",
        visitabile: true,
        note: "Reperti etruschi e romani del territorio (Piombino)",
        lat: 42.9236,
        lon: 10.5272,
        sito: "https://www.parchivaldicornia.it/museo-archeologico-del-territorio-di-populonia/",
        maps_url: mapsUrl(
          "Museo Archeologico del Territorio di Populonia, Piombino",
          42.9236,
          10.5272,
        ),
      },
    ];

    return NextResponse.json(
      {
        comune: "San Vincenzo",
        istat: COMUNE_ISTAT_CULTURA,
        n_luoghi: luoghi.length,
        luoghi,
        fonte: {
          nome: "Ministero della Cultura / Parchi Val di Cornia",
          url: "https://dati.beniculturali.it/",
          api: "https://opendata.beniculturali.it/",
          licenza: "CC-BY 4.0",
        },
        note: "Luoghi di interesse con sito ufficiale o link Google Maps",
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      },
    );
  } catch (error) {
    console.error("Errore API luoghi cultura:", error);
    return NextResponse.json(
      { error: "Impossibile recuperare i luoghi di cultura" },
      { status: 500 },
    );
  }
}
