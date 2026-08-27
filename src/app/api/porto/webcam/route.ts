import { NextResponse } from "next/server";
import { COMUNE_DI, HTTP_USER_AGENT } from "@/lib/constants";
import { COMUNE, isFeatureEnabled } from "@/lib/comune-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!isFeatureEnabled("porto")) {
    return NextResponse.json(
      { disponibile: false, error: "Modulo porto disattivato" },
      { status: 404 },
    );
  }

  const page = COMUNE.porto.webcam_page.trim();
  const base = COMUNE.porto.webcam_base.trim();
  if (!page) {
    return NextResponse.json(
      {
        disponibile: false,
        camere: [],
        error: "Webcam porto non configurate (porto.webcam_page in comune.json)",
      },
      { status: 404 },
    );
  }

  try {
    const res = await fetch(page, {
      cache: "no-store",
      headers: {
        Accept: "text/html",
        "User-Agent": HTTP_USER_AGENT,
      },
    });
    if (!res.ok) {
      throw new Error(`Webcam page HTTP ${res.status}`);
    }
    const html = await res.text();
    const nord = html.match(/webcamfoto\/(webcamnord_[^"'>\s]+)/i)?.[1] ?? null;
    const sud = html.match(/webcamfoto\/(webcamsud_[^"'>\s]+)/i)?.[1] ?? null;
    const camere = [
      nord && base
        ? { id: "nord", nome: "Porto — Vista Nord", url: `${base}${nord}` }
        : null,
      sud && base
        ? { id: "sud", nome: "Porto — Vista Sud", url: `${base}${sud}` }
        : null,
    ].filter(Boolean);

    return NextResponse.json(
      {
        disponibile: camere.length > 0,
        aggiornamento: "circa ogni 5 minuti",
        fetched_at: new Date().toISOString(),
        camere,
        fonte: { nome: `${COMUNE_DI} — WebCam`, url: page },
        note: `Immagini di proprietà del ${COMUNE_DI}; mostrate con attribuzione.`,
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
        fonte: { nome: `${COMUNE_DI} — WebCam`, url: page },
        error: "Impossibile recuperare le webcam ufficiali",
      },
      { status: 502 },
    );
  }
}
