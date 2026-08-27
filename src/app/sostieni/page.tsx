import { notFound } from "next/navigation";
import { ProjectShell } from "@/components/ProjectShell";
import { SostieniPanel } from "@/components/SostieniPanel";
import { isSostieniEnabled } from "@/lib/sostieni";

export default function SostieniPage() {
  if (!isSostieniEnabled()) notFound();

  return (
    <ProjectShell>
      <SostieniPanel asPage />
    </ProjectShell>
  );
}
