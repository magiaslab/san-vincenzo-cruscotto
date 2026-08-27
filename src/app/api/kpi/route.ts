import { NextResponse } from "next/server";
import { isComuneConfigured } from "@/lib/comune-config";
import { getCachedKpi } from "@/lib/dashboard";

export const revalidate = 86400;

export async function GET() {
  if (!isComuneConfigured()) {
    return NextResponse.json(
      {
        error: "comune_non_configurato",
        message:
          "Imposta istat_code in config/comune.json (non usare il placeholder 000000).",
      },
      { status: 503 },
    );
  }
  try {
    const data = await getCachedKpi();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("KPI error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare i KPI da Cruscotto Italia" },
      { status: 502 },
    );
  }
}
