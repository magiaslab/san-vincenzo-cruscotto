import { NextResponse } from "next/server";
import { COMUNE_DI } from "@/lib/constants";
import { isFeatureEnabled, isUpstreamDeploy } from "@/lib/comune-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WEBCAM_PAGE = "https://lnx.comune.sanvincenzo.li.it/webcam/";
const WEBCAM_BASE = "https://lnx.comune.sanvincenzo.li.it/webcamfoto/";

/**
 * Estrae gli URL aggiornati delle webcam ufficiali del Comune
 * (Vista Nord / Vista Sud sul porto). Aggiornamento tipico ~5 minuti.
 */
export async function GET() {
  if (!isFeatureEnabled("porto")) {
    return NextResponse.json(
      { disponibile: false, error: "Modulo porto disattivato" },
      { status: 404 },
    );
  }
  if (!isUpstreamDeploy()) {
    return NextResponse.json(
      {
        disponibile: false,
        camere: [],
        error: "Webcam porto non configurate per questo comune",
      },
      { status: 404 },
    );
  }

  try {
    const res = await fetch(WEBCAM_PAGE, {
      cache: "no-store",
      headers: {
        Accept: "text/html",
        "User-Agent":
          "Mozilla/5.0 (compatible; CruscottoSanVincenzo/1.0; +https://github.com/magiaslab/san-vincenzo-cruscotto)",
      },
    });
    if (!res.ok) {
      throw new Error(`Webcam page HTTP ${res.status}`);
    }
    const html = await res.text();
    const nord = html.match(/webcamfoto\/(webcamnord_[^"'>\s]+)/i)?.[1] ?? null;
    const sud = html.match(/webcamfoto\/(webcamsud_[^"'>\s]+)/i)?.[1] ?? null;

    return NextResponse.json(
      {
        disponibile: Boolean(nord || sud),
        aggiornamento: "circa ogni 5 minuti",
        fetched_at: new Date().toISOString(),
        camere: [
          nord
            ? {
                id: "nord",
                nome: "Porto — Vista Nord",
                url: `${WEBCAM_BASE}${nord}`,
              }
            : null,
          sud
            ? {
                id: "sud",
                nome: "Porto — Vista Sud",
                url: `${WEBCAM_BASE}${sud}`,
              }
            : null,
        ].filter(Boolean),
        fonte: {
          nome: `${COMUNE_DI} — WebCam`,
          url: WEBCAM_PAGE,
        },
        note: `Immagini di proprietà del ${COMUNE_DI}; mostrate con attribuzione e link alla fonte ufficiale.`,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=30",
        },
      },
    );
  } catch (err) {
    console.error("Webcam error", err);
    return NextResponse.json(
      {
        disponibile: false,
        camere: [],
        fonte: {
          nome: `${COMUNE_DI} — WebCam`,
          url: WEBCAM_PAGE,
        },
        error: "Impossibile recuperare le webcam ufficiali",
      },
      { status: 502 },
    );
  }
}
