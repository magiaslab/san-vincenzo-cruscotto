import { NextResponse } from "next/server";
import { buildEvPrezziPayload } from "@/lib/ev-prezzi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const payload = await buildEvPrezziPayload();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
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
