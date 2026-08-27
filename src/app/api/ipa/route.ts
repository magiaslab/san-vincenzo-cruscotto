import { IPA_FONTE, buildIpa } from "@/lib/ipa";
import { serveBuild } from "@/lib/open-data-route";

export const revalidate = 86400;

export async function GET() {
  return serveBuild(IPA_FONTE, (d) => d.enti.length === 0, () => buildIpa());
}
