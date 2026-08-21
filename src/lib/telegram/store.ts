/**
 * Persistenza segnalazioni DAE.
 *
 * Su Vercel il filesystem del deploy è immutabile. Ordine di preferenza:
 * 1. GitHub Issues (label `dae-segnalazione`) — tipicamente issues:write sul PAT
 * 2. GitHub Contents API sul file GeoJSON — richiede contents:write
 * 3. File locale `public/data/dae-segnalazioni.geojson` — solo in sviluppo
 *
 * Il token Vercel attuale ha spesso issues:write ma NON contents:write:
 * senza fallback Issues le segnalazioni fallivano con «NON salvata».
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { COMUNE_NOME, COMUNE_PROVINCIA, TELEGRAM_DAE_BOT_HANDLE } from "@/lib/constants";
import type {
  DaeSegnalazioneFeature,
  DaeSegnalazioneStatus,
  DaeSegnalazioniCollection,
} from "@/lib/telegram/types";

const REL_PATH = "public/data/dae-segnalazioni.geojson";
const ISSUE_MARKER = "<!-- dae-segnalazione:v1 -->";
const LABEL_BASE = "dae-segnalazione";
const LABEL_BY_STATUS: Record<DaeSegnalazioneStatus, string> = {
  pending: "dae-pending",
  approved_overlay: "dae-approved",
  rejected: "dae-rejected",
};

type GithubMeta = { sha?: string; content?: string };

type GithubIssue = {
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  html_url?: string;
  labels?: Array<{ name?: string } | string>;
  pull_request?: unknown;
};

function absolutePath() {
  return path.join(process.cwd(), REL_PATH);
}

function githubConfig() {
  const token =
    process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  const repo =
    process.env.GITHUB_REPO?.trim() || "magiaslab/san-vincenzo-cruscotto";
  const branch =
    process.env.GITHUB_BRANCH?.trim() ||
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    "master";
  return { token, repo, branch };
}

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "cruscotto-san-vincenzo-dae-bot",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function emptyCollection(): DaeSegnalazioniCollection {
  return {
    type: "FeatureCollection",
    features: [],
    meta: {
      fonte: `Segnalazioni cittadine via Telegram (${TELEGRAM_DAE_BOT_HANDLE})`,
      ambito: `${COMUNE_NOME} (${COMUNE_PROVINCIA})`,
      n: 0,
      nota: "Punti non ancora su OpenStreetMap; in emergenza chiama il 118.",
    },
  };
}

function normalizeCollection(
  json: unknown,
): DaeSegnalazioniCollection | null {
  if (!json || typeof json !== "object") return null;
  const col = json as DaeSegnalazioniCollection;
  if (col.type !== "FeatureCollection" || !Array.isArray(col.features)) {
    return null;
  }
  return col;
}

function stampMeta(collection: DaeSegnalazioniCollection) {
  collection.meta = {
    ...(collection.meta ?? {}),
    n: collection.features.length,
    updated_at: new Date().toISOString(),
  };
}

function isValidFeature(value: unknown): value is DaeSegnalazioneFeature {
  if (!value || typeof value !== "object") return false;
  const f = value as DaeSegnalazioneFeature;
  return (
    f.type === "Feature" &&
    f.geometry?.type === "Point" &&
    Array.isArray(f.geometry.coordinates) &&
    f.geometry.coordinates.length >= 2 &&
    Boolean(f.properties?.id) &&
    typeof f.properties.status === "string"
  );
}

function featureToIssueBody(feature: DaeSegnalazioneFeature): string {
  return [
    ISSUE_MARKER,
    "",
    `**ID:** \`${feature.properties.id}\``,
    `**Stato:** ${feature.properties.status}`,
    `**Ubicazione:** ${feature.properties.ubicazione}`,
    `**Coord:** ${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]}`,
    feature.properties.osm_url ? `**OSM:** ${feature.properties.osm_url}` : null,
    "",
    "```json",
    JSON.stringify(feature, null, 2),
    "```",
    "",
    "_Segnalazione DAE via @DaesanvincenzoBot — non modificare il blocco JSON._",
  ]
    .filter((l) => l != null)
    .join("\n");
}

function parseFeatureFromIssueBody(
  body: string | null,
): DaeSegnalazioneFeature | null {
  if (!body) return null;
  const fence = body.match(/```json\s*([\s\S]*?)```/i);
  if (!fence?.[1]) return null;
  try {
    const parsed: unknown = JSON.parse(fence[1]);
    return isValidFeature(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function issueTitle(feature: DaeSegnalazioneFeature): string {
  const ubi = feature.properties.ubicazione.replace(/\s+/g, " ").trim();
  return `[DAE] ${feature.properties.id} — ${ubi}`.slice(0, 200);
}

async function ensureLabels(token: string, repo: string) {
  const wanted: Array<{ name: string; color: string; description: string }> = [
    {
      name: LABEL_BASE,
      color: "0E8A16",
      description: "Segnalazione DAE via Telegram",
    },
    {
      name: LABEL_BY_STATUS.pending,
      color: "FBCA04",
      description: "DAE in moderazione",
    },
    {
      name: LABEL_BY_STATUS.approved_overlay,
      color: "1D76DB",
      description: "DAE approvato per overlay cruscotto",
    },
    {
      name: LABEL_BY_STATUS.rejected,
      color: "B60205",
      description: "DAE rifiutato",
    },
  ];
  for (const label of wanted) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/labels/${encodeURIComponent(label.name)}`,
      { headers: githubHeaders(token), cache: "no-store" },
    );
    if (res.ok) continue;
    if (res.status !== 404) {
      console.warn("label check failed", label.name, res.status);
      continue;
    }
    const create = await fetch(`https://api.github.com/repos/${repo}/labels`, {
      method: "POST",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(label),
    });
    if (!create.ok) {
      console.warn(
        "label create failed",
        label.name,
        create.status,
        await create.text(),
      );
    }
  }
}

async function listDaeIssues(
  token: string,
  repo: string,
): Promise<GithubIssue[]> {
  const out: GithubIssue[] = [];
  for (let page = 1; page <= 10; page++) {
    const url = new URL(`https://api.github.com/repos/${repo}/issues`);
    url.searchParams.set("state", "all");
    url.searchParams.set("labels", LABEL_BASE);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const res = await fetch(url, {
      headers: githubHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        "GitHub list DAE issues failed",
        res.status,
        await res.text(),
      );
      break;
    }
    const batch = (await res.json()) as GithubIssue[];
    // Solo issue pure (le PR hanno un oggetto pull_request valorizzato).
    const onlyIssues = batch.filter(
      (i) => i && typeof i.number === "number" && !i.pull_request,
    );
    out.push(...onlyIssues);
    if (batch.length < 100) break;
  }
  return out;
}

async function findIssueBySegnalazioneId(
  token: string,
  repo: string,
  id: string,
): Promise<GithubIssue | null> {
  // Elenco recente senza filtro label (il filtro labels è eventualmente consistente).
  try {
    const url = new URL(`https://api.github.com/repos/${repo}/issues`);
    url.searchParams.set("state", "all");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("sort", "created");
    url.searchParams.set("direction", "desc");
    const res = await fetch(url, {
      headers: githubHeaders(token),
      cache: "no-store",
    });
    if (res.ok) {
      const batch = (await res.json()) as GithubIssue[];
      for (const issue of batch) {
        if (issue.pull_request) continue;
        if (!issue.title?.startsWith("[DAE]")) continue;
        if (issue.title.includes(id)) {
          // Body completo per il parse JSON
          if (issue.body && issue.body.includes(ISSUE_MARKER)) return issue;
          const full = await fetch(
            `https://api.github.com/repos/${repo}/issues/${issue.number}`,
            { headers: githubHeaders(token), cache: "no-store" },
          );
          if (full.ok) return (await full.json()) as GithubIssue;
          return issue;
        }
      }
    } else {
      console.warn(
        "list-recent DAE issues failed",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.warn("list-recent DAE issue failed", err);
  }

  // Ultimo tentativo: issues con label (può ritardare qualche secondo).
  const issues = await listDaeIssues(token, repo);
  for (const issue of issues) {
    if (issue.title.includes(id)) return issue;
    const feat = parseFeatureFromIssueBody(issue.body);
    if (feat?.properties.id === id) return issue;
  }
  return null;
}

async function readFromIssues(): Promise<DaeSegnalazioniCollection | null> {
  const { token, repo } = githubConfig();
  if (!token) return null;
  try {
    // Unisci label-filter + recenti [DAE] (l’indice label può ritardare).
    const byId = new Map<string, DaeSegnalazioneFeature>();
    const labeled = await listDaeIssues(token, repo);
    for (const issue of labeled) {
      const feat = parseFeatureFromIssueBody(issue.body);
      if (feat) byId.set(feat.properties.id, feat);
    }

    const url = new URL(`https://api.github.com/repos/${repo}/issues`);
    url.searchParams.set("state", "all");
    url.searchParams.set("per_page", "50");
    url.searchParams.set("sort", "created");
    url.searchParams.set("direction", "desc");
    const recentRes = await fetch(url, {
      headers: githubHeaders(token),
      cache: "no-store",
    });
    if (recentRes.ok) {
      const recent = (await recentRes.json()) as GithubIssue[];
      for (const issue of recent) {
        if (issue.pull_request || !issue.title?.startsWith("[DAE]")) continue;
        const feat = parseFeatureFromIssueBody(issue.body);
        if (feat) byId.set(feat.properties.id, feat);
      }
    }

    const col = emptyCollection();
    col.features = [...byId.values()];
    stampMeta(col);
    col.meta = { ...(col.meta ?? {}), store: "github-issues" };
    return col;
  } catch (err) {
    console.error("readFromIssues failed", err);
    return null;
  }
}

async function upsertIssueFeature(
  feature: DaeSegnalazioneFeature,
  knownIssueNumber?: number,
): Promise<{
  ok: boolean;
  via: "github-issues" | "none";
  detail?: string;
  issueNumber?: number;
}> {
  const { token, repo } = githubConfig();
  if (!token) return { ok: false, via: "none", detail: "GITHUB_TOKEN assente" };

  try {
    await ensureLabels(token, repo);
    let existing: GithubIssue | null = null;
    if (knownIssueNumber && knownIssueNumber > 0) {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/issues/${knownIssueNumber}`,
        { headers: githubHeaders(token), cache: "no-store" },
      );
      if (res.ok) existing = (await res.json()) as GithubIssue;
    }
    if (!existing) {
      existing = await findIssueBySegnalazioneId(
        token,
        repo,
        feature.properties.id,
      );
    }
    const labels = [LABEL_BASE, LABEL_BY_STATUS[feature.properties.status]];
    const state =
      feature.properties.status === "rejected" ? "closed" : "open";
    const body = featureToIssueBody(feature);
    const title = issueTitle(feature);

    if (existing) {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/issues/${existing.number}`,
        {
          method: "PATCH",
          headers: {
            ...githubHeaders(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, body, labels, state }),
        },
      );
      if (!res.ok) {
        const detail = await res.text();
        console.error("GitHub update DAE issue failed", res.status, detail);
        return { ok: false, via: "none", detail: `HTTP ${res.status}` };
      }
      return { ok: true, via: "github-issues", issueNumber: existing.number };
    }

    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("GitHub create DAE issue failed", res.status, detail);
      return { ok: false, via: "none", detail: `HTTP ${res.status}` };
    }
    const created = (await res.json()) as GithubIssue;
    if (!created.number) {
      return { ok: false, via: "none", detail: "create senza number" };
    }
    return { ok: true, via: "github-issues", issueNumber: created.number };
  } catch (err) {
    console.error("upsertIssueFeature failed", err);
    return {
      ok: false,
      via: "none",
      detail: err instanceof Error ? err.message : "error",
    };
  }
}

async function readLocal(): Promise<DaeSegnalazioniCollection | null> {
  try {
    const raw = await readFile(absolutePath(), "utf8");
    return normalizeCollection(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeLocal(collection: DaeSegnalazioniCollection) {
  stampMeta(collection);
  await writeFile(
    absolutePath(),
    `${JSON.stringify(collection, null, 2)}\n`,
    "utf8",
  );
}

async function fetchGithubFile(): Promise<{
  collection: DaeSegnalazioniCollection | null;
  sha?: string;
  forbidden?: boolean;
}> {
  const { token, repo, branch } = githubConfig();
  if (!token) return { collection: null };

  const metaRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${REL_PATH}?ref=${encodeURIComponent(branch)}`,
    {
      headers: githubHeaders(token),
      cache: "no-store",
    },
  );
  if (metaRes.status === 404) return { collection: emptyCollection() };
  if (metaRes.status === 403) return { collection: null, forbidden: true };
  if (!metaRes.ok) {
    console.error(
      "GitHub read segnalazioni failed",
      metaRes.status,
      await metaRes.text(),
    );
    return { collection: null };
  }

  const meta = (await metaRes.json()) as GithubMeta;
  if (!meta.content) return { collection: emptyCollection(), sha: meta.sha };

  try {
    const raw = Buffer.from(meta.content, "base64").toString("utf8");
    const collection = normalizeCollection(JSON.parse(raw));
    return { collection: collection ?? emptyCollection(), sha: meta.sha };
  } catch (err) {
    console.error("GitHub parse segnalazioni failed", err);
    return { collection: null, sha: meta.sha };
  }
}

async function putGithubFile(
  collection: DaeSegnalazioniCollection,
  sha?: string,
): Promise<{ ok: boolean; forbidden?: boolean }> {
  const { token, repo, branch } = githubConfig();
  if (!token) return { ok: false };

  stampMeta(collection);
  const content = Buffer.from(
    `${JSON.stringify(collection, null, 2)}\n`,
    "utf8",
  ).toString("base64");

  const putRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${REL_PATH}`,
    {
      method: "PUT",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore(dae): aggiorna segnalazioni Telegram (${collection.features.length})`,
        content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );
  if (putRes.status === 403) {
    console.warn(
      "GitHub Contents write 403 (serve contents:write); uso Issues come store.",
    );
    return { ok: false, forbidden: true };
  }
  if (!putRes.ok) {
    const errText = await putRes.text();
    console.error("GitHub write segnalazioni failed", putRes.status, errText);
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Legge le segnalazioni: Issues (preferito) → Contents → locale.
 */
export async function readSegnalazioni(): Promise<DaeSegnalazioniCollection> {
  const fromIssues = await readFromIssues();
  if (fromIssues && fromIssues.features.length > 0) return fromIssues;

  const { token } = githubConfig();
  if (token) {
    const remote = await fetchGithubFile();
    if (remote.collection && remote.collection.features.length > 0) {
      return remote.collection;
    }
    // Issues vuote ma store issues attivo → preferisci Issues (anche se 0)
    if (fromIssues) return fromIssues;
    if (remote.collection) return remote.collection;
  }

  return (await readLocal()) ?? fromIssues ?? emptyCollection();
}

export async function saveSegnalazioni(
  collection: DaeSegnalazioniCollection,
): Promise<{ ok: boolean; via: string }> {
  const { token } = githubConfig();
  const onVercel = Boolean(process.env.VERCEL);

  // Scrivi feature per feature su Issues (store primario affidabile).
  if (token) {
    let allOk = true;
    for (const feature of collection.features) {
      const r = await upsertIssueFeature(feature);
      if (!r.ok) allOk = false;
    }
    if (allOk) {
      // Best-effort mirror su Contents (spesso 403 con PAT fine-grained).
      const remote = await fetchGithubFile();
      if (!remote.forbidden) {
        await putGithubFile(collection, remote.sha);
      }
      try {
        await writeLocal(collection);
      } catch {
        /* ignore su Vercel */
      }
      return { ok: true, via: "github-issues" };
    }
    if (onVercel) return { ok: false, via: "none" };
  } else if (onVercel) {
    console.error(
      "Segnalazioni DAE: su Vercel serve GITHUB_TOKEN con issues:write.",
    );
    return { ok: false, via: "none" };
  }

  try {
    await writeLocal(collection);
    return { ok: true, via: "local" };
  } catch (err) {
    console.error("Local write segnalazioni failed", err);
    return { ok: false, via: "none" };
  }
}

export async function upsertSegnalazione(
  feature: DaeSegnalazioneFeature,
): Promise<{ ok: boolean; via: string; detail?: string; issueNumber?: number }> {
  const { token } = githubConfig();
  const onVercel = Boolean(process.env.VERCEL);

  if (token) {
    const issueResult = await upsertIssueFeature(feature);
    if (issueResult.ok) {
      try {
        const col = await readSegnalazioni();
        const idx = col.features.findIndex(
          (f) => f.properties.id === feature.properties.id,
        );
        if (idx >= 0) col.features[idx] = feature;
        else col.features.push(feature);
        const remote = await fetchGithubFile();
        if (!remote.forbidden) {
          await putGithubFile(col, remote.sha);
        }
        try {
          await writeLocal(col);
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.warn("mirror after issue upsert failed", err);
      }
      return {
        ok: true,
        via: "github-issues",
        issueNumber: issueResult.issueNumber,
      };
    }
    if (onVercel) {
      return {
        ok: false,
        via: "none",
        detail: issueResult.detail ?? "persistenza Issues fallita",
      };
    }
  } else if (onVercel) {
    return {
      ok: false,
      via: "none",
      detail: "GITHUB_TOKEN assente su Vercel",
    };
  }

  const col = (await readLocal()) ?? emptyCollection();
  const idx = col.features.findIndex(
    (f) => f.properties.id === feature.properties.id,
  );
  if (idx >= 0) col.features[idx] = feature;
  else col.features.push(feature);
  try {
    await writeLocal(col);
    return { ok: true, via: "local" };
  } catch (err) {
    console.error("Local upsert failed", err);
    return { ok: false, via: "none", detail: "write locale fallita" };
  }
}

export async function setSegnalazioneStatus(
  id: string,
  status: DaeSegnalazioneStatus,
  note?: string,
  issueNumber?: number,
): Promise<DaeSegnalazioneFeature | null> {
  const { token, repo } = githubConfig();

  if (token) {
    let issue: GithubIssue | null = null;
    if (issueNumber && issueNumber > 0) {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/issues/${issueNumber}`,
        { headers: githubHeaders(token), cache: "no-store" },
      );
      if (res.ok) issue = (await res.json()) as GithubIssue;
    }
    if (!issue) {
      // Breve retry: l’indice Issues può ritardare di 1–2s.
      for (let attempt = 0; attempt < 4 && !issue; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 700 * attempt));
        }
        issue = await findIssueBySegnalazioneId(token, repo, id);
      }
    }
    const fromIssue = issue ? parseFeatureFromIssueBody(issue.body) : null;
    if (fromIssue) {
      fromIssue.properties.status = status;
      fromIssue.properties.reviewed_at = new Date().toISOString();
      if (note) fromIssue.properties.note_moderazione = note;
      const saved = await upsertIssueFeature(fromIssue, issue?.number);
      if (!saved.ok) {
        console.error(
          "setSegnalazioneStatus: persistenza fallita",
          id,
          saved.via,
        );
        return null;
      }
      return fromIssue;
    }
  }

  const col = await readSegnalazioni();
  const feat = col.features.find((f) => f.properties.id === id);
  if (!feat) return null;
  feat.properties.status = status;
  feat.properties.reviewed_at = new Date().toISOString();
  if (note) feat.properties.note_moderazione = note;
  const saved = await upsertSegnalazione(feat);
  if (!saved.ok) {
    console.error("setSegnalazioneStatus: persistenza fallita", id, saved.via);
    return null;
  }
  return feat;
}

export function approvedOnly(
  col: DaeSegnalazioniCollection,
): DaeSegnalazioniCollection {
  const features = col.features.filter(
    (f) => f.properties.status === "approved_overlay",
  );
  return {
    type: "FeatureCollection",
    features,
    meta: {
      ...(col.meta ?? {}),
      n: features.length,
      filter: "approved_overlay",
    },
  };
}
