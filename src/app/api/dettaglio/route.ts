import { NextRequest, NextResponse } from "next/server";
import { extractSections, getCachedDashboard } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 86400;

export async function GET(req: NextRequest) {
  try {
    const sezioniParam = req.nextUrl.searchParams.get("sezioni") ?? "";
    const sezioni = sezioniParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (sezioni.length === 0) {
      return NextResponse.json(
        {
          error:
            "Specifica almeno una sezione via query param, es. ?sezioni=siope,anac,pnrr",
        },
        { status: 400 },
      );
    }

    const dashboard = await getCachedDashboard();
    const data = extractSections(dashboard, sezioni);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("Dettaglio error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare il dettaglio da Cruscotto Italia" },
      { status: 502 },
    );
  }
}
