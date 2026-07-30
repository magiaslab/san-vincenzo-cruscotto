import type { Metadata } from "next";
import { DashboardTabs } from "@/components/DashboardTabs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { getCachedKpi } from "@/lib/dashboard";
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
  // Non ridefinire openGraph qui: in Next.js sostituisce interamente
  // quello del layout e fa sparire og:image (critico per i social).
};

export default async function Home() {
  let kpi: Record<string, unknown> = {};
  let error: string | null = null;

  try {
    kpi = await getCachedKpi();
  } catch (err) {
    console.error(err);
    error =
      "Non è stato possibile recuperare i KPI da Cruscotto Italia. Riprova più tardi.";
  }

  const generatedAt =
    typeof kpi._generated_at === "string" ? kpi._generated_at : null;
  const homeJsonLd = <JsonLd data={buildHomeJsonLd()} />;

  if (error) {
    return (
      <>
        {homeJsonLd}
        <Header generatedAt={generatedAt} />
        <main id="contenuto-principale" className="flex-1">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="rounded-lg border border-[#d9364f] bg-[#fce8eb] p-4 text-[#17324d]">
              {error}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      {homeJsonLd}
      <DashboardTabs kpi={kpi} generatedAt={generatedAt} />
    </>
  );
}
