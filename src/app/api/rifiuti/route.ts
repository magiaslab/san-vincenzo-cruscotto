import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { ISTAT_CODE } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/comune-config";
import { openDataEmpty, openDataOk } from "@/lib/opendata";
import {
  ARRR_DATI_COMUNALI_URL,
  buildRifiutiData,
  ISPRA_RIFIUTI_FONTE,
  ISPRA_RIFIUTI_URL,
  type RifiutiData,
} from "@/lib/ispra-rifiuti";

export const revalidate = 86400;

const getCached = unstable_cache(
  async () => buildRifiutiData(),
  ["rifiuti-ispra-v1", ISTAT_CODE],
  { revalidate: 86400 },
);

export async function GET() {
  if (!isFeatureEnabled("rifiuti_ispra")) {
    return NextResponse.json(
      openDataEmpty<RifiutiData>({
        fonte: ISPRA_RIFIUTI_FONTE,
        note: "Modulo rifiuti ISPRA spento in config/comune.json (features.rifiuti_ispra).",
      }),
      { status: 200, headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  }

  try {
    const data = (await getCached()) ?? (await buildRifiutiData());
    if (!data) {
      return NextResponse.json(
        openDataEmpty<RifiutiData>({
          fonte: ISPRA_RIFIUTI_FONTE,
          note: `Nessuna riga Catasto Rifiuti ISPRA per ISTAT ${ISTAT_CODE}.`,
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
        fonte: ISPRA_RIFIUTI_FONTE,
        edizione: String(data.ultimo.anno),
        note: `CSV comunale ISPRA (${ISPRA_RIFIUTI_URL}). Serie certificata ARRR/Regione: ${ARRR_DATI_COMUNALI_URL}. Il gestore (es. SEI) può pubblicare RD% infra-annuali non certificate.`,
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
    console.error("API /api/rifiuti error", err);
    return NextResponse.json(
      openDataEmpty<RifiutiData>({
        fonte: ISPRA_RIFIUTI_FONTE,
        error: "Impossibile scaricare il CSV ISPRA dei rifiuti urbani.",
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
