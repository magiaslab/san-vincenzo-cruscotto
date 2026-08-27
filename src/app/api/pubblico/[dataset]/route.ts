import { NextResponse } from "next/server";
import { GET as getAmministratori } from "@/app/api/amministratori/route";
import { GET as getConfronto } from "@/app/api/confronto/route";
import { GET as getD7b } from "@/app/api/demografia-mensile/route";
import { GET as getIpa } from "@/app/api/ipa/route";
import { GET as getKpi } from "@/app/api/kpi/route";
import { GET as getPgra } from "@/app/api/pgra/route";
import { GET as getRifiuti } from "@/app/api/rifiuti/route";
import { GET as getRifiutiAgenzia } from "@/app/api/rifiuti-agenzia/route";
import { GET as getStazioni } from "@/app/api/stazioni/route";
import { GET as getTerremoti } from "@/app/api/terremoti/route";
import { GET as getTurismo } from "@/app/api/turismo/route";
import { flattenKpi, toCsv } from "@/lib/pubblico";

export const revalidate = 3600;

const DATASETS: Record<string, () => Promise<Response>> = {
  kpi: getKpi,
  turismo: getTurismo,
  rifiuti: getRifiuti,
  amministratori: getAmministratori,
  terremoti: getTerremoti,
  ipa: getIpa,
  "demografia-mensile": getD7b,
  stazioni: getStazioni,
  "rifiuti-agenzia": getRifiutiAgenzia,
  pgra: getPgra,
  confronto: getConfronto,
};

type Props = { params: Promise<{ dataset: string }> };

function asRows(dataset: string, json: unknown): Array<Record<string, unknown>> {
  if (!json || typeof json !== "object") return [];
  const obj = json as Record<string, unknown>;
  const data = "data" in obj ? obj.data : obj;

  if (dataset === "kpi" && data && typeof data === "object") {
    return [flattenKpi(data as Record<string, unknown>)];
  }
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;

  const arrays: Array<unknown> = [
    d.persone,
    d.eventi,
    d.enti,
    d.mesi,
    d.stazioni,
    d.layers,
    d.comuni,
    d.annuale,
    d.serie,
  ];
  for (const a of arrays) {
    if (Array.isArray(a) && a.length > 0 && typeof a[0] === "object") {
      return a as Array<Record<string, unknown>>;
    }
  }
  return [d];
}

export async function GET(req: Request, { params }: Props) {
  const { dataset } = await params;
  const loader = DATASETS[dataset];
  if (!loader) {
    return NextResponse.json(
      { ok: false, error: `Dataset sconosciuto: ${dataset}` },
      { status: 404 },
    );
  }
  const format = new URL(req.url).searchParams.get("format") || "json";
  const upstream = await loader();
  const json: unknown = await upstream.json();

  if (format === "csv") {
    const csv = toCsv(asRows(dataset, json));
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dataset}.csv"`,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  }

  return NextResponse.json(json, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
