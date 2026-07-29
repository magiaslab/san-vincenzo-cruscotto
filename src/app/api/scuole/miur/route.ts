import { NextResponse } from "next/server";
import { getCachedMiurScuole } from "@/lib/miur";

export const revalidate = 86400;
export const maxDuration = 60;

export async function GET() {
  try {
    const data = await getCachedMiurScuole();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Errore API scuole MIUR:", error);
    return NextResponse.json(
      {
        error: "Impossibile recuperare i dati scuole da dati.istruzione.it",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
