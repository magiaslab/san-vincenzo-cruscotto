import { AttribuzioniPanel } from "@/components/AttribuzioniPanel";
import { ProjectShell } from "@/components/ProjectShell";

export default function AttribuzioniPage() {
  return (
    <ProjectShell>
      <AttribuzioniPanel asPage />
    </ProjectShell>
  );
}
