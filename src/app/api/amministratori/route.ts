import { DAIT_FONTE, buildAmministratori } from "@/lib/dait";
import { serveBuild } from "@/lib/open-data-route";

export const revalidate = 86400;

export async function GET() {
  return serveBuild(
    DAIT_FONTE,
    (d) => d.persone.length === 0,
    () => buildAmministratori(),
  );
}
