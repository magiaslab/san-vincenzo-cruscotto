import type { Metadata } from "next";
import { DashboardView } from "@/components/DashboardView";
import { JsonLd } from "@/components/JsonLd";
import { LandingHome } from "@/components/landing/LandingHome";
import { LandingShell } from "@/components/landing/LandingShell";
import { isLandingSite } from "@/lib/comune-config";
import {
  SITE_DESCRIPTION,
  SITE_TITLE_DEFAULT,
  buildHomeJsonLd,
} from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE_DEFAULT },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function Home() {
  if (isLandingSite()) {
    return (
      <>
        <JsonLd data={buildHomeJsonLd()} />
        <LandingShell>
          <LandingHome />
        </LandingShell>
      </>
    );
  }

  return <DashboardView />;
}
