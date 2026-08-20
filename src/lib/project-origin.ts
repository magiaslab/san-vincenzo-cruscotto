/**
 * Riferimenti del progetto ORIGINALE (Cruscotto San Vincenzo / magiaslab).
 * Nei fork NON vanno modificati: restano in Attribuzioni, Riusa/fork e footer
 * come credito al progetto sorgente. Il maintainer del fork si indica in
 * `config/comune.json` → `fork`.
 */
export const PROJECT_ORIGIN = {
  author: {
    name: "Alessandro Cipriani",
    email: "cipriani.alessandro@gmail.com",
  },
  github_repo_url:
    "https://github.com/magiaslab/san-vincenzo-cruscotto" as const,
  site_url: "https://www.cruscottosanvincenzo.it" as const,
  comune_demo: "San Vincenzo" as const,
  provincia_demo: "LI" as const,
  vercel_deploy_url:
    "https://vercel.com/new/clone?repository-url=https://github.com/magiaslab/san-vincenzo-cruscotto" as const,
  docs_riuso_path: "/blob/master/docs/riuso-fork.md" as const,
  config_example_path: "/blob/master/config/comune.example.json" as const,
  env_example_path: "/blob/master/.env.example" as const,
} as const;

export const PROJECT_ORIGIN_FORK_URL = `${PROJECT_ORIGIN.github_repo_url}/fork`;
export const PROJECT_ORIGIN_DOCS_RIUSO_URL = `${PROJECT_ORIGIN.github_repo_url}${PROJECT_ORIGIN.docs_riuso_path}`;
export const PROJECT_ORIGIN_CONFIG_EXAMPLE_URL = `${PROJECT_ORIGIN.github_repo_url}${PROJECT_ORIGIN.config_example_path}`;
export const PROJECT_ORIGIN_ENV_EXAMPLE_URL = `${PROJECT_ORIGIN.github_repo_url}${PROJECT_ORIGIN.env_example_path}`;
