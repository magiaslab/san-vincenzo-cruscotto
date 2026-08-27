import { EFFIS_FONTE, buildIncendi } from "@/lib/effis";
import { serveBuild } from "@/lib/open-data-route";

export const revalidate = 86400;

export async function GET() {
  return serveBuild(
    EFFIS_FONTE,
    (d) => Boolean(d.note?.startsWith("Modulo spento")),
    () => buildIncendi(),
  );
}
