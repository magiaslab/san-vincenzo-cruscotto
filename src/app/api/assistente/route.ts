import { NextRequest, NextResponse } from "next/server";
import { ASSISTENTE_MODAL_URL_DEFAULT } from "@/lib/constants";
import { matchFaq } from "@/lib/assistente-faq";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type AskBody = {
  question?: string;
  q?: string;
  k?: number;
};

function resolveModalUrl(): string {
  return (
    process.env.ASSISTENTE_MODAL_URL?.trim() || ASSISTENTE_MODAL_URL_DEFAULT
  );
}

/**
 * Proxy verso il RAG su Modal.
 * Per domande note risponde in locale con il dato o il link alla sezione del cruscotto
 * (evita allucinazioni del modello piccolo).
 */
export async function POST(req: NextRequest) {
  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ error: "JSON non valido" }, { status: 400 });
  }

  const question = String(body.question ?? body.q ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Domanda vuota" }, { status: 400 });
  }
  if (question.length > 800) {
    return NextResponse.json({ error: "Domanda troppo lunga" }, { status: 400 });
  }

  const faq = matchFaq(question);
  if (faq) {
    return NextResponse.json(
      {
        answer: faq.answer,
        link: faq.link,
        mode: "faq",
        model: "local-faq",
        sources: faq.sources,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const modalUrl = resolveModalUrl();
  if (!modalUrl) {
    return NextResponse.json(
      {
        error: "assistente_non_configurato",
        message:
          "ASSISTENTE_MODAL_URL non impostato. Non si riusa l’indice RAG di un altro comune.",
        answer:
          "L’assistente RAG non è attivo su questo deploy. Consulta le sezioni del cruscotto dal menu.",
        link: { href: "/#panoramica", label: "Apri Panoramica" },
        sources: [],
      },
      { status: 503 },
    );
  }
  try {
    const upstream = await fetch(modalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, k: body.k ?? 3 }),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { error: "Risposta Modal non JSON", raw: text.slice(0, 500) };
    }

    // Se Modal non ha un link, prova a ricavarlo dalle fonti
    if (!data.link && Array.isArray(data.sources)) {
      const link = linkFromSources(data.sources as Array<{ source?: string }>);
      if (link) data.link = link;
    }

    return NextResponse.json(data, {
      status: upstream.ok ? 200 : upstream.status || 502,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("Assistente Modal error", err);
    return NextResponse.json(
      {
        error: "upstream_error",
        message: "Impossibile contattare il servizio RAG su Modal.",
        answer:
          "Non riesco a raggiungere l’indice RAG. Prova le sezioni del cruscotto dal menu.",
        link: { href: "/#panoramica", label: "Apri Panoramica" },
        sources: [],
      },
      { status: 502 },
    );
  }
}

function linkFromSources(
  sources: Array<{ source?: string }>,
): { href: string; label: string } | null {
  const map: Array<[RegExp, string, string]> = [
    [/porto/i, "/#porto", "Apri sezione Porto"],
    [/carburant|banda|ev_pun|veicol|trasport|pendolar|infra/i, "/#infra", "Apri sezione Mobilità"],
    [/meteo|allert/i, "/#meteo", "Apri sezione Meteo"],
    [/sanita|farmac/i, "/#sanita", "Apri sezione Sanità"],
    [/turism|event/i, "/#turismo", "Apri sezione Turismo"],
    [/ambient|aria|rifiut|balne/i, "/#ambiente", "Apri sezione Ambiente"],
    [/imprese|asia|pnrr|redditi|econom/i, "/#economia", "Apri sezione Economia"],
    [/finanz|siope/i, "/#finanza", "Apri sezione Finanza"],
    [/scuol|istruz|miur/i, "/#istruzione", "Apri sezione Istruzione"],
    [/societ|welfare/i, "/#societa", "Apri sezione Società"],
    [/disabil|accessib|wheelchair|barriere|peba/i, "/#disabilita", "Apri sezione Disabilità"],
    [/popolaz|demograf|panoramic/i, "/#panoramica", "Apri sezione Panoramica"],
    [/territor/i, "/#territorio", "Apri sezione Territorio"],
    [/mappa|catasto|civici/i, "/#mappa", "Apri sezione Mappa"],
  ];
  for (const s of sources) {
    const name = String(s.source ?? "");
    for (const [re, href, label] of map) {
      if (re.test(name)) return { href, label };
    }
  }
  return null;
}

export async function GET() {
  const modalUrl = resolveModalUrl();
  return NextResponse.json({
    configured: Boolean(modalUrl),
    using_default: !process.env.ASSISTENTE_MODAL_URL?.trim(),
    endpoint: modalUrl,
    faq: true,
    models: {
      embed: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
      gen: "HuggingFaceTB/SmolLM2-360M-Instruct",
    },
    docs: "modal_rag/README.md",
  });
}
