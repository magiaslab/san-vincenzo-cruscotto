import { INGV_FONTE, buildTerremoti } from "@/lib/ingv";
import { serveBuild } from "@/lib/open-data-route";

export const revalidate = 3600;

export async function GET() {
  return serveBuild(
    INGV_FONTE,
    (d) => d.eventi.length === 0,
    () => buildTerremoti(),
  );
}
