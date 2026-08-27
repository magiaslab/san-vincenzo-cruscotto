import { PGRA_FONTE, buildPgra } from "@/lib/pgra";
import { serveBuild } from "@/lib/open-data-route";

export const revalidate = 86400;

export async function GET() {
  return serveBuild(
    PGRA_FONTE,
    (d) => d.layers.length === 0,
    () => buildPgra(),
  );
}
