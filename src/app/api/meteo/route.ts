import { NextResponse } from "next/server";
import { ISTAT_CODE } from "@/lib/constants";
import { callMcpTool, callMcpToolHttp } from "@/lib/mcp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Meteo live: niente cache lunga, dato quasi real-time. */
export async function GET() {
  try {
    let data: Record<string, unknown>;
    try {
      data = await callMcpTool<Record<string, unknown>>("comune_kpi", {
        istat_code: ISTAT_CODE,
      });
    } catch {
      data = await callMcpToolHttp<Record<string, unknown>>("comune_kpi", {
        istat_code: ISTAT_CODE,
      });
    }

    return NextResponse.json(
      {
        meteo: data.meteo_italiameteo ?? null,
        _generated_at: data._generated_at ?? null,
        live: true,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    console.error("Meteo error", err);
    return NextResponse.json(
      { error: "Impossibile recuperare il meteo live" },
      { status: 502 },
    );
  }
}
