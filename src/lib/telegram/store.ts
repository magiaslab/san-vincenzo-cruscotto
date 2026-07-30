/**
 * Persistenza segnalazioni DAE.
 *
 * Su Vercel il filesystem del deploy è immutabile: senza store remoto
 * le scritture locali non sopravvivono alla richiesta successiva.
 * Con GITHUB_TOKEN (contents:write) GitHub è la fonte di verità;
 * in locale si usa public/data/dae-segnalazioni.geojson.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  DaeSegnalazioneFeature,
  DaeSegnalazioneStatus,
  DaeSegnalazioniCollection,
} from "@/lib/telegram/types";

const REL_PATH = "public/data/dae-segnalazioni.geojson";

type GithubMeta = { sha?: string; content?: string };

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
  };
}

function emptyCollection(): DaeSegnalazioniCollection {
  return {
    type: "FeatureCollection",
    features: [],
    meta: {
      fonte: "Segnalazioni cittadine via Telegram (@DaesanvincenzoBot)",
      ambito: "San Vincenzo (LI)",
      n: 0,
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
): Promise<boolean> {
  const { token, repo, branch } = githubConfig();
  if (!token) return false;

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
  if (!putRes.ok) {
    const errText = await putRes.text();
    console.error("GitHub write segnalazioni failed", putRes.status, errText);
    return false;
  }
  return true;
}

/**
 * Legge le segnalazioni: su Vercel con token usa GitHub (fonte aggiornata);
 * altrimenti il GeoJSON locale del deploy / workspace.
 */
export async function readSegnalazioni(): Promise<DaeSegnalazioniCollection> {
  const { token } = githubConfig();
  if (token) {
    const remote = await fetchGithubFile();
    if (remote.collection) return remote.collection;
  }
  return (await readLocal()) ?? emptyCollection();
}

export async function saveSegnalazioni(
  collection: DaeSegnalazioniCollection,
): Promise<{ ok: boolean; via: "github" | "local" | "none" }> {
  const { token } = githubConfig();
  const onVercel = Boolean(process.env.VERCEL);

  if (token) {
    // Retry su conflitto SHA (due aggiornamenti concomitanti).
    for (let attempt = 0; attempt < 3; attempt++) {
      const remote = await fetchGithubFile();
      const sha = remote.sha;
      // Se c’è già una versione remota, unisci per id (vince l’argomento).
      const base = remote.collection ?? emptyCollection();
      const byId = new Map(
        base.features.map((f) => [f.properties.id, f] as const),
      );
      for (const f of collection.features) {
        byId.set(f.properties.id, f);
      }
      const merged: DaeSegnalazioniCollection = {
        type: "FeatureCollection",
        features: [...byId.values()],
        meta: collection.meta ?? base.meta,
      };
      const ok = await putGithubFile(merged, sha);
      if (ok) {
        // Best-effort mirror locale (utile in dev; su Vercel può fallire).
        try {
          await writeLocal(merged);
        } catch {
          /* ignore */
        }
        return { ok: true, via: "github" };
      }
      // 409 / SHA stale → riprova
    }
    // Su Vercel senza scrittura GitHub riuscita non c’è store durevole.
    if (onVercel) return { ok: false, via: "none" };
  } else if (onVercel) {
    console.error(
      "Segnalazioni DAE: su Vercel serve GITHUB_TOKEN (contents:write); il FS locale non persiste.",
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
): Promise<{ ok: boolean; via: string }> {
  const col = await readSegnalazioni();
  const idx = col.features.findIndex(
    (f) => f.properties.id === feature.properties.id,
  );
  if (idx >= 0) col.features[idx] = feature;
  else col.features.push(feature);
  return saveSegnalazioni(col);
}

export async function setSegnalazioneStatus(
  id: string,
  status: DaeSegnalazioneStatus,
  note?: string,
): Promise<DaeSegnalazioneFeature | null> {
  const col = await readSegnalazioni();
  const feat = col.features.find((f) => f.properties.id === id);
  if (!feat) return null;
  feat.properties.status = status;
  feat.properties.reviewed_at = new Date().toISOString();
  if (note) feat.properties.note_moderazione = note;
  const saved = await saveSegnalazioni(col);
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
    meta: { ...(col.meta ?? {}), n: features.length, filter: "approved_overlay" },
  };
}
