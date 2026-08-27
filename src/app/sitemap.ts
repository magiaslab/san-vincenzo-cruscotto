import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { sitemapSectionPaths } from "@/lib/sections";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return sitemapSectionPaths().map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
