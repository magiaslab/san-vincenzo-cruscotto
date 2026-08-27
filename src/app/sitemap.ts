import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { sitemapSectionPaths } from "@/lib/sections";
import { isSostieniEnabled } from "@/lib/sostieni";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = sitemapSectionPaths().map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
  pages.push(
    {
      url: absoluteUrl("/come-funziona"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/esempi"),
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
  );
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
