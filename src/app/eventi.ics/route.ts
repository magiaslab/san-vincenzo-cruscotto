import { NextResponse } from "next/server";
import { GET as getEventi } from "@/app/api/comune/eventi/route";
import { eventiToIcs } from "@/lib/eventi-ics";

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await getEventi();
    const json = (await res.json()) as {
      eventi?: Array<{
        id?: string | null;
        titolo?: string;
        periodo?: string | null;
        orario?: string | null;
        luogo?: string | null;
        descrizione?: string | null;
        url?: string | null;
      }>;
    };
    const eventi = (json.eventi ?? [])
      .filter((e) => e.titolo)
      .map((e) => ({
        id: e.id,
        titolo: e.titolo as string,
        periodo: e.periodo,
        orario: e.orario,
        luogo: e.luogo,
        descrizione: e.descrizione,
        url: e.url,
      }));
    const body = eventiToIcs(eventi);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="eventi.ics"',
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    console.error("eventi.ics", err);
    return new NextResponse("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n", {
      status: 200,
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  }
}
