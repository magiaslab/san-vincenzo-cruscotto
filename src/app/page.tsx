import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";
import { JsonLd } from "@/components/JsonLd";
import { buildHomeJsonLd, SITE_DESCRIPTION, SITE_TITLE_DEFAULT } from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE_DEFAULT },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function Home() {
  return (
    <>
      <JsonLd data={buildHomeJsonLd()} />
      <DashboardView />
    </>
  );
}
