import { NextResponse } from "next/server";
import { getCachedKpi } from "@/lib/dashboard";

export const revalidate = 86400;

export async function GET() {
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
