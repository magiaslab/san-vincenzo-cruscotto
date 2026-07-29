"use client";

import { FormEvent, useState } from "react";
import { LoadingBlock, SectionIntro } from "@/components/ui";

type Source = {
  title?: string;
  source?: string;
  score?: number;
  excerpt?: string;
};

type Msg = {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
};

const SUGGESTIONS = [
  "Quante colonnine EV ci sono a San Vincenzo?",
  "Qual è la copertura FTTH?",
  "Dove trovo i prezzi dei carburanti?",
  "Cosa mostra la sezione Porto?",
];

export default function AssistenteChat({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Ciao: sono l’assistente RAG del cruscotto. Uso un modello open Hugging Face su Modal e rispondo solo con i dati indicizzati del sito.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as {
        answer?: string;
        message?: string;
        error?: string;
        sources?: Source[];
      };
      const text =
        data.answer?.trim() ||
        data.message ||
        (data.error === "assistente_non_configurato"
          ? "Servizio non configurato: deploya modal_rag su Modal e imposta ASSISTENTE_MODAL_URL."
          : "Non sono riuscito a rispondere.");
      setMessages((m) => [
        ...m,
        { role: "assistant", text, sources: data.sources },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Errore di rete verso /api/assistente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  const chatBody = (
    <>
      <div className={`mb-3 flex flex-wrap gap-2 ${compact ? "px-1" : ""}`}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--pa-border)] bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--pa-ink)] hover:bg-[var(--pa-surface-soft)] sm:text-sm"
            onClick={() => void ask(s)}
            disabled={loading}
          >
            {compact ? s.replace(" a San Vincenzo?", "?").slice(0, 42) : s}
          </button>
        ))}
      </div>

      <div
        className={`panel flex flex-col overflow-hidden p-0 ${
          compact ? "min-h-0 flex-1" : "min-h-[360px]"
        }`}
      >
        <div
          className={`flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 ${
            compact ? "max-h-[min(48vh,420px)]" : ""
          }`}
        >
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`max-w-[920px] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-[var(--pa-primary)] text-white"
                  : "bg-[var(--pa-surface-soft)] text-[var(--pa-ink)]"
              }`}
            >
              <p className="m-0 whitespace-pre-wrap">{m.text}</p>
              {m.sources && m.sources.length > 0 ? (
                <ul className="mb-0 mt-2 list-disc pl-4 text-xs text-[var(--pa-muted)]">
                  {m.sources.map((s, j) => (
                    <li key={j}>
                      <strong>{s.title || s.source}</strong>
                      {s.score != null ? ` · score ${s.score}` : ""}
                      {s.excerpt ? ` — ${s.excerpt.slice(0, 120)}…` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {loading ? (
            <LoadingBlock label="Generazione risposta su Modal…" />
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-[var(--pa-border)] bg-white p-3 sm:flex-row sm:items-end"
        >
          <label className="m-0 flex-1 text-sm">
            <span className="mb-1 block text-[var(--pa-muted)]">La tua domanda</span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={compact ? 2 : 2}
              className="w-full resize-y rounded-lg border border-[var(--pa-border)] px-3 py-2 text-[var(--pa-ink)]"
              placeholder="Es. Quanti impianti carburanti ci sono?"
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--pa-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--pa-primary-hover)] disabled:opacity-50"
            style={{ color: "#ffffff" }}
          >
            Chiedi
          </button>
        </form>
      </div>
    </>
  );

  if (compact) {
    return <div className="flex h-full flex-col">{chatBody}</div>;
  }

  return (
    <section>
      <SectionIntro
        title="Assistente (RAG)"
        description="Domande in italiano sui dati del cruscotto. Embedding MiniLM multilingue + SmolLM2-360M su Modal (Hugging Face, self-host)."
      />
      {chatBody}
      <p className="mt-3 text-xs text-[var(--pa-muted)]">
        Modelli:{" "}
        <a
          href="https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          paraphrase-multilingual-MiniLM-L12-v2
        </a>{" "}
        +{" "}
        <a
          href="https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          SmolLM2-360M-Instruct
        </a>
        . Deploy: <code>modal_rag/README.md</code> → workspace Modal{" "}
        <code>magiaslab</code>.
      </p>
    </section>
  );
}
