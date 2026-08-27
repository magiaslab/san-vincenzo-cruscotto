import { COMUNE } from "@/lib/comune-config";
import { serveBuild } from "@/lib/open-data-route";
import { buildRifiutiAgenzia } from "@/lib/rifiuti-agenzia";

export const revalidate = 86400;

export async function GET() {
  const fonte =
    COMUNE.gestori.rifiuti.agenzia_regionale.nome ||
    "Agenzia regionale rifiuti";
  return serveBuild(
    fonte,
    (d) => d.fileUrl == null && d.rdPct == null,
    () => buildRifiutiAgenzia(),
  );
}
