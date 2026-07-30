import { NextResponse } from "next/server";
import {
  FS_STAZIONE_SAN_VINCENZO,
  VIAGGIATRENO_ATTRIBUTION_URL,
  fetchTreniLive,
} from "@/lib/viaggiatreno";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Board live FS San Vincenzo: partenze, arrivi e ritardi (ViaggiaTreno).
 * Fonte non ufficiale / non garantita; in emergenza usare canali Trenitalia/RFI.
 */
export async function GET() {
  try {
    const live = await fetchTreniLive(FS_STAZIONE_SAN_VINCENZO);
    return NextResponse.json(
      {
        ...live,
        station_name: "S.Vincenzo",
        source: "viaggiatreno",
        source_url: VIAGGIATRENO_ATTRIBUTION_URL,
        note: "Dati live non ufficiali da ViaggiaTreno; verificare sempre su canali Trenitalia/RFI.",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (err) {
    console.error("treni live error", err);
    return NextResponse.json(
      {
        error: "Impossibile recuperare arrivi/partenze live",
        station_id: FS_STAZIONE_SAN_VINCENZO,
        partenze: [],
        arrivi: [],
      },
      { status: 502 },
    );
  }
}
