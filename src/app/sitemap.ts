import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { isSostieniEnabled } from "@/lib/sostieni";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/come-funziona"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/riusa"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: absoluteUrl("/attribuzioni"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/partecipa"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
  if (isSostieniEnabled()) {
    pages.push({
      url: absoluteUrl("/sostieni"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.45,
    });
  }
  return pages;
}
