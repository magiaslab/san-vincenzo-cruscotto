import { STAZIONI_FONTE, buildStazioni } from "@/lib/stazioni-wfs";
import { serveBuild } from "@/lib/open-data-route";

export const revalidate = 3600;

export async function GET() {
  return serveBuild(
    STAZIONI_FONTE,
    (d) => d.stazioni.length === 0,
    () => buildStazioni(),
  );
}
