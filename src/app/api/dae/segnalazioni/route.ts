import { NextResponse } from "next/server";
import { approvedOnly, readSegnalazioni } from "@/lib/telegram/store";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** Overlay pubblico: solo segnalazioni approvate dai moderatori. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "1";
    const col = await readSegnalazioni();
    const out = all ? col : approvedOnly(col);
    return NextResponse.json(out, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("dae segnalazioni error", err);
    return NextResponse.json(
      { error: "Impossibile caricare le segnalazioni DAE" },
      { status: 500 },
    );
  }
}
