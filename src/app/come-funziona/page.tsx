import { ComeFunzionaPanel } from "@/components/ComeFunzionaPanel";
import { JsonLd } from "@/components/JsonLd";
import { ProjectShell } from "@/components/ProjectShell";
import { buildFaqJsonLd, comeFunzionaFaq } from "@/lib/seo";

export default function ComeFunzionaPage() {
  return (
    <ProjectShell>
      <JsonLd
        id="jsonld-faq-come-funziona"
        data={buildFaqJsonLd(comeFunzionaFaq())}
      />
      <ComeFunzionaPanel asPage />
    </ProjectShell>
  );
}
