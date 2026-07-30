import { NextResponse } from "next/server";
import { buildEvPrezziPayload } from "@/lib/ev-prezzi";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const payload = await buildEvPrezziPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (err) {
    console.error("EV prezzi error", err);
    return NextResponse.json(
      {
        disponibile: false,
        error: "ev_prezzi_unavailable",
        message: "Impossibile aggregare gestori e prezzi delle colonnine EV.",
        disclaimer:
          "I prezzi €/kWh sono indicativi. Verifica sempre sulla fonte ufficiale o sull’app del gestore prima di ricaricare.",
        stazioni: [],
      },
      { status: 502 },
    );
  }
}
