import type { Metadata, Viewport } from "next";
import { Titillium_Web } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { JsonLd } from "@/components/JsonLd";
import { Providers } from "@/components/Providers";
import { AUTHOR, COMUNE_NOME } from "@/lib/constants";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  absoluteUrl,
  buildHomeJsonLd,
  getSiteUrl,
} from "@/lib/seo";
import "./globals.css";

const titillium = Titillium_Web({
  weight: ["300", "400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-titillium",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0066cc",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: AUTHOR.name, url: `mailto:${AUTHOR.email}` }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  keywords: [...SITE_KEYWORDS],
  category: "open data",
  alternates: {
    canonical: "/",
    languages: {
      "it-IT": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "it_IT",
    siteName: SITE_NAME,
    url: absoluteUrl("/"),
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — dati aperti ${COMUNE_NOME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "64x64" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  other: {
    author: AUTHOR.name,
    "geo.region": "IT-LI",
    "geo.placename": COMUNE_NOME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${titillium.variable} flex min-h-screen flex-col antialiased`}
      >
        <Providers>
          <JsonLd data={buildHomeJsonLd()} />
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
