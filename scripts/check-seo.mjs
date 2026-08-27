#!/usr/bin/env node
/**
 * Controlli SEO anti-regressione.
 * Default: analisi statica del sorgente (adatto alla CI).
 * Con --http: fetch della sitemap (SEO_CHECK_BASE_URL o http://localhost:3000).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const HTTP = process.argv.includes("--http");
const BASE = (process.env.SEO_CHECK_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) acc.push(p);
  }
  return acc;
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function staticChecks() {
  const files = walk(join(ROOT, "src"));
  for (const file of files) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, "utf8");
    if (/window\.location\.replace\s*\(\s*[`'"]\/#/.test(text)) {
      fail(`${rel}: stub JS verso frammento (window.location.replace("/#…"))`);
    }
    if (rel.includes("i18n/detect")) {
      const code = text
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      if (/navigator\.(language|languages)/.test(code)) {
        fail(`${rel}: detectLocale non deve usare navigator.language`);
      }
    }
  }
  const html = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
  if (!html.includes('lang="it"')) {
    fail('src/app/layout.tsx: manca lang="it" sul documento');
  }
  if (process.exitCode) return;
  console.log("check:seo statico OK");
}

async function httpChecks() {
  const sm = await fetch(`${BASE}/sitemap.xml`);
  if (!sm.ok) {
    fail(`sitemap.xml → ${sm.status}`);
    return;
  }
  const xml = await sm.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length < 5) fail(`sitemap troppo corta (${urls.length} URL)`);
  const MIN_WORDS = 40;
  for (const loc of urls) {
    const path = new URL(loc).pathname || "/";
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    if (res.status !== 200) {
      fail(`${path} → ${res.status}`);
      continue;
    }
    const html = await res.text();
    if (!/<h1[\s>]/i.test(html)) fail(`${path}: manca <h1>`);
    if (!/<html[^>]*lang=["']it["']/i.test(html)) {
      fail(`${path}: html lang non è it`);
    }
    const canon = html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    );
    const expected = path === "/" ? `${BASE}/` : `${BASE}${path}`;
    if (canon && !canon[1].replace(/\/$/, "").endsWith(path.replace(/\/$/, "") || "")) {
      // home: canonical deve coincidere con BASE/
      if (path === "/") {
        if (!canon[1].endsWith("/") && canon[1] !== `${BASE}/` && canon[1] !== BASE) {
          fail(`${path}: canonical ${canon[1]} ≠ ${expected}`);
        }
      }
    }
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words < MIN_WORDS) fail(`${path}: solo ${words} parole`);
    if (/Reindirizzamento/.test(html)) fail(`${path}: ancora stub di redirect`);
  }
  if (!process.exitCode) console.log(`check:seo HTTP OK (${urls.length} URL su ${BASE})`);
}

staticChecks();
if (HTTP) {
  await httpChecks();
}
if (process.exitCode) process.exit(process.exitCode);
