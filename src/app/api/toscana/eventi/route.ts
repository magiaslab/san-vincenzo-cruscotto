import { NextResponse } from "next/server";
import { REGIONE_TOSCANA_CKAN_API } from "@/lib/constants";

const CACHE_DURATION = 7200; // 2 ore

export async function GET() {
  try {
    // Query CKAN API per eventi culturali in Toscana
    // Dataset ID: rt-eventi-sistcult
    
    const packageUrl = `${REGIONE_TOSCANA_CKAN_API}/package_show?id=rt-eventi-sistcult`;
    
    const response = await fetch(packageUrl, {
      headers: {
        "User-Agent": "Cruscotto-San-Vincenzo/1.0",
      },
      next: { revalidate: CACHE_DURATION },
    });

    if (!response.ok) {
      throw new Error(`CKAN API error: ${response.status}`);
    }

    const ckanData = await response.json();
    
    const data = {
      disponibile: ckanData.success ?? false,
      dataset: ckanData.result?.name ?? "rt-eventi-sistcult",
      title: ckanData.result?.title ?? "Eventi Sistema Cultura",
      description: ckanData.result?.notes ?? "",
      resources: (ckanData.result?.resources ?? []).map((r: Record<string, unknown>) => ({
        nome: r.name,
        formato: r.format,
        url: r.url,
        ultima_modifica: r.last_modified,
      })),
      categorie: ["Musei", "Biblioteche", "Archeologia", "Eventi culturali"],
      note: "Eventi promossi dalla Regione Toscana: Amico Museo, Notti dell'Archeologia, eventi biblioteche",
      fonte: {
        nome: "Regione Toscana - Open Data",
        url: "https://dati.toscana.it/dataset/rt-eventi-sistcult",
        licenza: "CC-BY 4.0",
      },
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error("Errore API eventi Toscana:", error);
    
    // Fallback con dati di esempio
    const fallbackData = {
      disponibile: false,
      messaggio: "Servizio temporaneamente non disponibile",
      categorie: ["Musei", "Biblioteche", "Archeologia"],
      fonte: {
        nome: "Regione Toscana - Open Data",
        url: "https://dati.toscana.it/dataset/rt-eventi-sistcult",
      },
    };
    
    return NextResponse.json(fallbackData, {
      headers: {
        "Cache-Control": `public, s-maxage=300, stale-while-revalidate`,
      },
    });
  }
}
