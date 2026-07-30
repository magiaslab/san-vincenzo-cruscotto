/**
 * Persistenza segnalazioni DAE su GeoJSON locale (+ opzionale commit GitHub).
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  DaeSegnalazioneFeature,
  DaeSegnalazioneStatus,
  DaeSegnalazioniCollection,
} from "@/lib/telegram/types";

const REL_PATH = "public/data/dae-segnalazioni.geojson";

function absolutePath() {
  return path.join(process.cwd(), REL_PATH);
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

export async function readSegnalazioni(): Promise<DaeSegnalazioniCollection> {
  try {
    const raw = await readFile(absolutePath(), "utf8");
    const json = JSON.parse(raw) as DaeSegnalazioniCollection;
    if (!Array.isArray(json.features)) return emptyCollection();
    return json;
  } catch {
    return emptyCollection();
  }
}

async function writeLocal(collection: DaeSegnalazioniCollection) {
  collection.meta = {
    ...(collection.meta ?? {}),
    n: collection.features.length,
    updated_at: new Date().toISOString(),
  };
  await writeFile(
    absolutePath(),
    `${JSON.stringify(collection, null, 2)}\n`,
    "utf8",
  );
}

/**
 * Aggiorna il file su GitHub (per persistenza da Vercel).
 * Richiede GITHUB_TOKEN con permesso contents:write sul repo.
 */
async function writeViaGithub(collection: DaeSegnalazioniCollection) {
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  const repo =
    process.env.GITHUB_REPO?.trim() || "magiaslab/san-vincenzo-cruscotto";
  const branch =
    process.env.GITHUB_BRANCH?.trim() ||
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    "master";
  if (!token) return false;

  collection.meta = {
    ...(collection.meta ?? {}),
    n: collection.features.length,
    updated_at: new Date().toISOString(),
  };
  const content = Buffer.from(
    `${JSON.stringify(collection, null, 2)}\n`,
    "utf8",
  ).toString("base64");

  const metaRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${REL_PATH}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "cruscotto-san-vincenzo-dae-bot",
      },
    },
  );
  let sha: string | undefined;
  if (metaRes.ok) {
    const meta = (await metaRes.json()) as { sha?: string };
    sha = meta.sha;
  }

  const putRes = await fetch(
    `https://api.github.com/repos/${repo}/contents/${REL_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "cruscotto-san-vincenzo-dae-bot",
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

export async function saveSegnalazioni(
  collection: DaeSegnalazioniCollection,
): Promise<{ ok: boolean; via: "github" | "local" | "none" }> {
  const viaGithub = await writeViaGithub(collection);
  if (viaGithub) return { ok: true, via: "github" };
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
  await saveSegnalazioni(col);
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
