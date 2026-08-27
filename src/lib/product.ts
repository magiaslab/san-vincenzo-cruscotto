/**
 * Identità del prodotto TEMPLATE (Cruscotto Comune), distinta dal comune
 * configurato in `config/comune.json` e dal primo esemplare (San Vincenzo).
 */
import {
  COMUNE,
  isComuneConfigured,
  isLandingSite,
  isTemplateDeploy,
} from "@/lib/comune-config";
import { PROJECT_ORIGIN } from "@/lib/project-origin";

export { isLandingSite, isTemplateDeploy, isComuneConfigured };

export const PRODUCT_NAME_DEFAULT = "Cruscotto Comune";

export function getProductName(): string {
  const fromSite = COMUNE.site.product_name.trim();
  if (fromSite) return fromSite;
  if (isComuneConfigured()) return `Cruscotto ${COMUNE.nome}`;
  return PRODUCT_NAME_DEFAULT;
}

export function getProductTagline(): string {
  return (
    COMUNE.site.tagline.trim() ||
    "Dashboard open data per qualsiasi comune italiano"
  );
}

/** Repo GitHub da cui forkare (template). Fallback: primo esemplare. */
export function getTemplateGithubUrl(): string {
  return (
    COMUNE.site.github_repo_url.trim() ||
    COMUNE.fork.github_repo_url.trim() ||
    PROJECT_ORIGIN.github_repo_url
  );
}

export function getTemplateForkUrl(): string {
  return `${getTemplateGithubUrl()}/fork`;
}

/** Branch di default del template (repo nuova = `main`). */
export const TEMPLATE_DEFAULT_BRANCH = "main";

export function getTemplateBlobUrl(path: string): string {
  const clean = path.replace(/^\//, "");
  return `${getTemplateGithubUrl()}/blob/${TEMPLATE_DEFAULT_BRANCH}/${clean}`;
}

export function getVercelDeployUrl(): string {
  return `https://vercel.com/new/clone?repository-url=${encodeURIComponent(getTemplateGithubUrl())}`;
}

export function getDemoUrl(): string {
  return COMUNE.site.demo_url.trim() || PROJECT_ORIGIN.site_url;
}

export function getDemoLabel(): string {
  return COMUNE.site.demo_label.trim() || `Cruscotto ${PROJECT_ORIGIN.comune_demo}`;
}

export function getDashboardPath(): string {
  return isLandingSite() ? "/cruscotto" : "/";
}

export function githubRepoSlugFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\//, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]!.replace(/\.git$/, "")}`;
  } catch {
    return null;
  }
}

/** owner/repo per Issues, DAE persistenza, Partecipa. */
export function getGithubRepoSlug(): string {
  const fromEnv = process.env.GITHUB_REPO?.trim();
  if (fromEnv) return fromEnv;
  const fromFork = githubRepoSlugFromUrl(COMUNE.fork.github_repo_url);
  if (fromFork) return fromFork;
  const fromSite = githubRepoSlugFromUrl(COMUNE.site.github_repo_url);
  if (fromSite) return fromSite;
  const fromOrigin = githubRepoSlugFromUrl(PROJECT_ORIGIN.github_repo_url);
  return fromOrigin || "magiaslab/cruscotto-comune";
}

