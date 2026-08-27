/**
 * Helper per route open-data empty-safe: sempre HTTP 200.
 */
import { NextResponse } from "next/server";
import { openDataEmpty, openDataOk, type OpenDataResult } from "@/lib/opendata";

const OK_CACHE = "public, s-maxage=86400, stale-while-revalidate=3600";
const EMPTY_CACHE = "public, s-maxage=120, stale-while-revalidate=60";

export function jsonOpenData<T>(body: OpenDataResult<T>): NextResponse {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": body.ok ? OK_CACHE : EMPTY_CACHE,
    },
  });
}

export async function serveBuild<T extends { note?: string | null }>(
  fonte: string,
  isEmpty: (data: T) => boolean,
  build: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const data = await build();
    if (isEmpty(data)) {
      return jsonOpenData(
        openDataEmpty<T>({
          fonte,
          note: data.note ?? "Nessun dato.",
        }),
      );
    }
    return jsonOpenData(openDataOk(data, { fonte, note: data.note }));
  } catch (err) {
    console.error(fonte, err);
    return jsonOpenData(
      openDataEmpty<T>({
        fonte,
        error:
          err instanceof Error ? err.message : "Errore nel recupero dati.",
      }),
    );
  }
}
