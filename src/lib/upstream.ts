import pkg from "../../package.json";
import { isTemplateDeploy } from "@/lib/comune-config";
import { getTemplateGithubUrl, githubRepoSlugFromUrl } from "@/lib/product";

/** Versione del template in questo deploy (`package.json`). */
export const LOCAL_TEMPLATE_VERSION: string = pkg.version;

export function shouldCheckUpstreamUpdates(): boolean {
  return !isTemplateDeploy();
}

export function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da < db) return -1;
    if (da > db) return 1;
  }
  return 0;
}

export function getUpstreamPackageJsonUrl(): string | null {
  const slug = githubRepoSlugFromUrl(getTemplateGithubUrl());
  if (!slug) return null;
  return `https://raw.githubusercontent.com/${slug}/main/package.json`;
}

export function getUpstreamChangelogUrl(): string {
  return `${getTemplateGithubUrl()}/blob/main/CHANGELOG.md`;
}

export function getUpstreamReleasesUrl(): string {
  return `${getTemplateGithubUrl()}/releases`;
}

export async function fetchUpstreamVersion(): Promise<string | null> {
  const url = getUpstreamPackageJsonUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: unknown };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}
