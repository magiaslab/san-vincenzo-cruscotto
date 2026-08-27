import type { Metadata } from "next";
import { DashboardTabs } from "@/components/DashboardTabs";
import { JsonLd } from "@/components/JsonLd";
import { getCachedKpi } from "@/lib/dashboard";
import {
  SITE_DESCRIPTION,
  SITE_TITLE_DEFAULT,
  buildHomeJsonLd,
} from "@/lib/seo";
import { getSection } from "@/lib/sections";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE_DEFAULT },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  // Non ridefinire openGraph qui: in Next.js sostituisce interamente
  // quello del layout e fa sparire og:image (critico per i social).
};

export default async function Home() {
  let kpi: Record<string, unknown> = {};

  try {
    kpi = await getCachedKpi();
  } catch (err) {
    console.error(err);
  }

  const generatedAt =
    typeof kpi._generated_at === "string" ? kpi._generated_at : null;
  const home = getSection("panoramica");

  return (
    <>
      <JsonLd id="jsonld-home" data={buildHomeJsonLd()} />
      <DashboardTabs
        kpi={kpi}
        generatedAt={generatedAt}
        seoIntro={{ h1: home.h1, intro: home.intro }}
      />
    </>
  );
}
