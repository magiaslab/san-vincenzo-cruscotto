import { NextResponse } from "next/server";
import {
  buildFallbackIssueUrl,
  createFeedbackIssue,
  feedbackConfigured,
  type FeedbackPayload,
  type FeedbackTipo,
} from "@/lib/feedback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIPI: FeedbackTipo[] = [
  "miglioramento",
  "bug",
  "domanda",
  "nuovo_dato",
];

/** Rate limit grezzo in-memory (best-effort su serverless). */
const hits = new Map<string, { n: number; reset: number }>();

function rateLimit(ip: string, max = 5, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < now) {
    hits.set(ip, { n: 1, reset: now + windowMs });
    return true;
  }
  if (cur.n >= max) return false;
  cur.n += 1;
  return true;
}

function clean(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.replace(/\0/g, "").trim().slice(0, max);
}

export async function GET() {
  return NextResponse.json({
    service: "feedback",
    configured: feedbackConfigured(),
    mode: feedbackConfigured() ? "github_api" : "github_fallback_url",
  });
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Troppe richieste. Riprova più tardi." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
  }

  // Honeypot anti-bot
  if (clean(body.website, 200)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const tipo = clean(body.tipo, 40) as FeedbackTipo;
  if (!TIPI.includes(tipo)) {
    return NextResponse.json({ error: "Tipo non valido" }, { status: 400 });
  }

  const titolo = clean(body.titolo, 120);
  const messaggio = clean(body.messaggio, 4000);
  if (titolo.length < 5) {
    return NextResponse.json(
      { error: "Il titolo deve avere almeno 5 caratteri" },
      { status: 400 },
    );
  }
  if (messaggio.length < 20) {
    return NextResponse.json(
      { error: "Descrivi meglio il suggerimento (min. 20 caratteri)" },
      { status: 400 },
    );
  }

  const payload: FeedbackPayload = {
    tipo,
    sezione: clean(body.sezione, 80) || undefined,
    titolo,
    messaggio,
    contatto: clean(body.contatto, 120) || undefined,
    pagina: clean(body.pagina, 300) || undefined,
    userAgent: clean(req.headers.get("user-agent"), 300) || undefined,
  };

  if (!feedbackConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "fallback",
      url: buildFallbackIssueUrl(payload),
      message:
        "Apri la pagina GitHub per completare l’invio (serve un account GitHub).",
    });
  }

  const result = await createFeedbackIssue(payload);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        url: buildFallbackIssueUrl(payload),
        mode: "fallback",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "github_api",
    url: result.url,
    number: result.number,
  });
}
