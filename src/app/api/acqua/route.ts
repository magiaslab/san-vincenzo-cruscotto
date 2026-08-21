import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { ISTAT_CODE } from "@/lib/constants";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import {
  ACQUA_FONTE,
  buildAcquaData,
  hasAcquaPayload,
  type AcquaData,
} from "@/lib/asa-acqua";

export const revalidate = 21600;

const getCached = unstable_cache(
  async () => buildAcquaData(),
  ["acqua-sii-v1", ISTAT_CODE, COMUNE.gestori.acqua.geoserver_wfs],
  { revalidate: 21600 },
);

export async function GET() {
  if (!isFeatureEnabled("acqua_sii")) {
    return NextResponse.json(
      openDataEmpty<AcquaData>({
        fonte: ACQUA_FONTE,
        note: "Modulo servizio idrico spento in config/comune.json (features.acqua_sii).",
      }),
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  }

  try {
    const data = (await getCached()) ?? (await buildAcquaData());
    if (!hasAcquaPayload(data)) {
      return NextResponse.json(
        openDataEmpty<AcquaData>({
          fonte: ACQUA_FONTE,
          note:
            "Nessun WFS etichette/fontanelle e nessun gestore in gestori.acqua. ASA non pubblica un catalogo CKAN: serve geoserver_wfs (ATO 5) o i link istituzionali.",
        }),
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
          },
        },
      );
    }
    const nE = data!.etichette.length;
    const nF = data!.fontanelle.length;
    return NextResponse.json(
      openDataOk(data!, {
        fonte: nE + nF > 0 ? ACQUA_FONTE : data!.gestore.nome || ACQUA_FONTE,
        note:
          nE + nF > 0
            ? `WFS GeoServer del gestore: ${nE} etichette, ${nF} fontanelle. Qualità tecnica regionale (RQTII) è su AIT, non sul comune.`
            : "Nessun layer WFS per questo comune. Restano i link al gestore e all’Autorità Idrica Toscana.",
      }),
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=21600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("API /api/acqua error", err);
    return NextResponse.json(
      openDataEmpty<AcquaData>({
        fonte: ACQUA_FONTE,
        error: "Impossibile interrogare il WFS del gestore idrico.",
      }),
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    );
  }
}
