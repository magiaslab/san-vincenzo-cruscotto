import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type AskBody = {
  question?: string;
  q?: string;
  k?: number;
};

/**
 * Proxy verso il RAG su Modal (modelli HF self-host, niente API LLM a pagamento).
 * Imposta ASSISTENTE_MODAL_URL sull'endpoint POST web_ask deployato.
 */
export async function POST(req: NextRequest) {
  const modalUrl = process.env.ASSISTENTE_MODAL_URL?.trim();
  if (!modalUrl) {
    return NextResponse.json(
      {
        error: "assistente_non_configurato",
        message:
          "Imposta ASSISTENTE_MODAL_URL con l'endpoint Modal (vedi modal_rag/README.md).",
        answer: "",
        sources: [],
      },
      { status: 503 },
    );
  }

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

  try {
    const upstream = await fetch(modalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, k: body.k ?? 4 }),
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: "Risposta Modal non JSON", raw: text.slice(0, 500) };
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
        answer: "",
        sources: [],
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  const configured = Boolean(process.env.ASSISTENTE_MODAL_URL?.trim());
  return NextResponse.json({
    configured,
    models: {
      embed: "sentence-transformers/all-MiniLM-L6-v2",
      gen: "HuggingFaceTB/SmolLM2-360M-Instruct",
    },
    docs: "modal_rag/README.md",
  });
}
