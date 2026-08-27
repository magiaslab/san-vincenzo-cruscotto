import type { Metadata } from "next";
import {
  SITE_NAME,
  absoluteUrl,
  buildOgImages,
} from "@/lib/seo";

const PAGE_DESCRIPTION =
  `Come forkare il ${SITE_NAME} per un altro comune: ISTAT, Vercel e moduli. Progetto indipendente, non ufficiale.`;

export const metadata: Metadata = {
  title: "Riusa / fork",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/riusa",
  },
  openGraph: {
    title: `Riusa / fork | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/riusa"),
    type: "article",
    siteName: SITE_NAME,
    locale: "it_IT",
    images: buildOgImages(`${SITE_NAME} — riusa e fork`),
  },
  twitter: {
    card: "summary_large_image",
    title: `Riusa / fork | ${SITE_NAME}`,
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
