import { D7B_FONTE, buildD7b } from "@/lib/istat-d7b";
import { serveBuild } from "@/lib/open-data-route";

export const revalidate = 86400;

export async function GET() {
  return serveBuild(D7B_FONTE, (d) => d.mesi.length === 0, () => buildD7b());
}
