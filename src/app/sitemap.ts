import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { isSostieniEnabled } from "@/lib/sostieni";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/progetto"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/fonti"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/riuso"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/menzioni"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/cruscotto"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/come-funziona"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/attribuzioni"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
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
