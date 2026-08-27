import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardTabs } from "@/components/DashboardTabs";
import { JsonLd } from "@/components/JsonLd";
import { isTabEnabled } from "@/lib/comune-config";
import { getCachedKpi } from "@/lib/dashboard";
import {
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildDatasetJsonLd,
  buildOgImages,
  datasetsForSection,
} from "@/lib/seo";
import {
  getSectionBySlug,
  indexableDashboardSections,
} from "@/lib/sections";

export const revalidate = 86400;

type Props = { params: Promise<{ sezione: string }> };

export function generateStaticParams() {
  return indexableDashboardSections().map((s) => ({ sezione: s.slug as string }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sezione } = await params;
  const section = getSectionBySlug(sezione);
  if (!section || section.kind !== "dashboard" || !section.slug) {
    return { robots: { index: false, follow: false } };
  }
  return {
    title: section.title,
    description: section.description,
    alternates: { canonical: section.path },
    openGraph: {
      title: `${section.title} | ${SITE_NAME}`,
      description: section.description,
      url: absoluteUrl(section.path),
      type: "article",
      siteName: SITE_NAME,
      locale: "it_IT",
      images: buildOgImages(section.h1),
    },
    twitter: {
      card: "summary_large_image",
      title: `${section.title} | ${SITE_NAME}`,
      description: section.description,
      images: [absoluteUrl("/og-image.jpg")],
    },
  };
}

export default async function SezionePage({ params }: Props) {
  const { sezione } = await params;
  const section = getSectionBySlug(sezione);
  if (
    !section ||
    section.kind !== "dashboard" ||
    !section.slug ||
    !isTabEnabled(section.id)
  ) {
    notFound();
  }

  let kpi: Record<string, unknown> = {};
  try {
    kpi = await getCachedKpi();
  } catch (err) {
    console.error(err);
  }

  const generatedAt =
    typeof kpi._generated_at === "string" ? kpi._generated_at : null;

  return (
    <>
      <JsonLd
        id={`jsonld-breadcrumb-${section.slug}`}
        data={buildBreadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: section.label, path: section.path },
        ])}
      />
      <JsonLd
        id={`jsonld-dataset-${section.slug}`}
        data={buildDatasetJsonLd(datasetsForSection(section.id))}
      />
      <DashboardTabs
        kpi={kpi}
        generatedAt={generatedAt}
        seoIntro={{ h1: section.h1, intro: section.intro }}
      />
    </>
  );
}
