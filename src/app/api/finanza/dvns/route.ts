import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { ISTAT_CODE } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/comune-config";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import {
  buildDvnsFinanzaData,
  DVNS_FONTE,
  DVNS_SITE_URL,
  hasDvnsPayload,
  type DvnsFinanzaData,
} from "@/lib/dvns";

export const revalidate = 86400;

const getCached = unstable_cache(
  async () => buildDvnsFinanzaData(),
  ["finanza-dvns-v1", ISTAT_CODE],
  { revalidate: 86400 },
);

export async function GET() {
  if (!isFeatureEnabled("finanza_dvns")) {
    return NextResponse.json(
      openDataEmpty<DvnsFinanzaData>({
        fonte: DVNS_FONTE,
        note: "Modulo DVNS spento in config/comune.json (features.finanza_dvns).",
      }),
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  }

  try {
    const data = (await getCached()) ?? (await buildDvnsFinanzaData());
    if (!hasDvnsPayload(data)) {
      return NextResponse.json(
        openDataEmpty<DvnsFinanzaData>({
          fonte: DVNS_FONTE,
          note: `Nessun record IRPEF/OpenCivitas per ISTAT ${ISTAT_CODE}. Il SIOPE comunale resta su AgID: DVNS non espone la riga del singolo Comune.`,
        }),
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
          },
        },
      );
    }
    return NextResponse.json(
      openDataOk(data, {
        fonte: DVNS_FONTE,
        edizione: data.irpef
          ? String(data.irpef.anno_imposta)
          : data.opencivitas
            ? String(data.opencivitas.anno)
            : undefined,
        note: `Aggregatore civico ${DVNS_SITE_URL} (MCP). IRPEF = imposta netta dichiarata, non gettito di cassa. OpenCivitas non misura spreco. Non sommare IRPEF, SIOPE e fabbisogni.`,
      }),
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      },
    );
  } catch (err) {
    console.error("API /api/finanza/dvns error", err);
    return NextResponse.json(
      openDataEmpty<DvnsFinanzaData>({
        fonte: DVNS_FONTE,
        error: "Impossibile interrogare il MCP DoveVannoINostriSoldi.",
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
