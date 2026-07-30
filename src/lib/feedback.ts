/**
 * Crea una GitHub Issue da un suggerimento cittadino.
 * Richiede GITHUB_TOKEN (o GH_TOKEN) con permesso issues:write sul repo.
 */
import { GITHUB_REPO_URL } from "@/lib/constants";

export type FeedbackTipo =
  | "miglioramento"
  | "bug"
  | "domanda"
  | "nuovo_dato";

export type FeedbackPayload = {
  tipo: FeedbackTipo;
  sezione?: string;
  titolo: string;
  messaggio: string;
  contatto?: string;
  pagina?: string;
  userAgent?: string;
};

const TIPO_LABEL: Record<FeedbackTipo, string> = {
  miglioramento: "Miglioramento",
  bug: "Problema / bug",
  domanda: "Domanda",
  nuovo_dato: "Nuovo dato / fonte",
};

const TIPO_LABELS_GH: Record<FeedbackTipo, string[]> = {
  miglioramento: ["enhancement"],
  bug: ["bug"],
  domanda: ["question"],
  nuovo_dato: ["enhancement"],
};

function repoSlug(): string {
  const fromEnv = process.env.GITHUB_REPO?.trim();
  if (fromEnv) return fromEnv;
  return GITHUB_REPO_URL.replace("https://github.com/", "");
}

function token(): string | null {
  return (
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.GH_TOKEN?.trim() ||
    process.env.GITHUB_FEEDBACK_TOKEN?.trim() ||
    null
  );
}

export function feedbackConfigured(): boolean {
  return Boolean(token());
}

export function buildFallbackIssueUrl(payload: FeedbackPayload): string {
  const title = `[Suggerimento] ${payload.titolo}`.slice(0, 200);
  const body = [
    `**Tipo:** ${TIPO_LABEL[payload.tipo]}`,
    payload.sezione ? `**Sezione:** ${payload.sezione}` : null,
    "",
    payload.messaggio,
    "",
    "---",
    payload.contatto ? `Contatto: ${payload.contatto}` : null,
    payload.pagina ? `Pagina: ${payload.pagina}` : null,
    "_Inviato dal form Partecipa del cruscotto._",
  ]
    .filter((l) => l != null)
    .join("\n");
  const labels = TIPO_LABELS_GH[payload.tipo].join(",");
  const u = new URL(`${GITHUB_REPO_URL}/issues/new`);
  u.searchParams.set("title", title);
  u.searchParams.set("body", body);
  u.searchParams.set("labels", labels);
  return u.toString();
}

export async function createFeedbackIssue(
  payload: FeedbackPayload,
): Promise<{ ok: true; url: string; number: number } | { ok: false; error: string }> {
  const t = token();
  if (!t) {
    return { ok: false, error: "GITHUB_TOKEN non configurato" };
  }

  const title = `[Suggerimento] ${payload.titolo}`.slice(0, 200);
  const body = [
    `## Suggerimento dal cruscotto`,
    "",
    `| Campo | Valore |`,
    `| --- | --- |`,
    `| Tipo | ${TIPO_LABEL[payload.tipo]} |`,
    `| Sezione | ${payload.sezione || "—"} |`,
    `| Contatto | ${payload.contatto || "—"} |`,
    `| Pagina | ${payload.pagina || "—"} |`,
    "",
    "### Messaggio",
    "",
    payload.messaggio,
    "",
    "<details><summary>Metadati tecnici</summary>",
    "",
    "```",
    `user-agent: ${payload.userAgent || "n/d"}`,
    `quando: ${new Date().toISOString()}`,
    "```",
    "",
    "</details>",
    "",
    "_Issue creata automaticamente dal form **Partecipa**._",
  ].join("\n");

  const res = await fetch(`https://api.github.com/repos/${repoSlug()}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${t}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "Cruscotto-San-Vincenzo-Feedback",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title,
      body,
      labels: TIPO_LABELS_GH[payload.tipo],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("GitHub create issue failed", res.status, text);
    return {
      ok: false,
      error:
        res.status === 401 || res.status === 403
          ? "Permessi GitHub insufficienti"
          : `GitHub HTTP ${res.status}`,
    };
  }

  const json = (await res.json()) as { html_url: string; number: number };
  return { ok: true, url: json.html_url, number: json.number };
}

export { TIPO_LABEL };
