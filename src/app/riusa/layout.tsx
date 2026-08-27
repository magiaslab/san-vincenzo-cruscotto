import type { Metadata } from "next";
import {
  SITE_NAME,
  absoluteUrl,
  buildOgImages,
} from "@/lib/seo";

const PAGE_DESCRIPTION =
  `Come portare il cruscotto in un altro comune, anche senza programmare: GitHub, Vercel e il file del comune. Progetto indipendente, non ufficiale.`;

export const metadata: Metadata = {
  title: "Porta nel tuo comune",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/riusa",
  },
  openGraph: {
    title: `Porta nel tuo comune | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/riusa"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — porta nel tuo comune`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Porta nel tuo comune | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    images: [absoluteUrl("/og-image.jpg")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RiusaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
