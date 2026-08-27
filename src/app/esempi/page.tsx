import { CruscottiRetePanel } from "@/components/CruscottiRetePanel";
import { JsonLd } from "@/components/JsonLd";
import { ProjectShell } from "@/components/ProjectShell";
import { CRUSCOTTI_RETE } from "@/lib/cruscotti-rete";
import { SITE_NAME } from "@/lib/seo";

export default function EsempiPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Cruscotti comunali — ${SITE_NAME}`,
    itemListElement: CRUSCOTTI_RETE.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Cruscotto ${c.nome}`,
      url: c.url,
    })),
  };

  return (
    <ProjectShell wide>
      <JsonLd id="jsonld-cruscotti-rete" data={jsonLd} />
      <CruscottiRetePanel asPage />
    </ProjectShell>
  );
}
