import { NextResponse } from "next/server";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";
import {
  FS_STAZIONE_SAN_VINCENZO,
  VIAGGIATRENO_ATTRIBUTION_URL,
  fetchTreniLive,
} from "@/lib/viaggiatreno";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Board live FS della stazione configurata: partenze, arrivi e ritardi (ViaggiaTreno).
 * Fonte non ufficiale / non garantita; in emergenza usare canali Trenitalia/RFI.
 */
export async function GET() {
  if (!isFeatureEnabled("treni") || !FS_STAZIONE_SAN_VINCENZO) {
    return NextResponse.json(
      {
        disponibile: false,
        error: "Modulo treni disattivato per questo comune",
        station_id: null,
        partenze: [],
        arrivi: [],
      },
      { status: 404 },
    );
  }

  try {
    const live = await fetchTreniLive(FS_STAZIONE_SAN_VINCENZO);
    return NextResponse.json(
      {
        ...live,
        station_name:
          COMUNE.ferrovie.stazione_nome || COMUNE.nome,
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
