"use client";

import { useT } from "@/lib/i18n";
import { FormEvent, useState } from "react";
import { LoadingBlock, SectionIntro, SolidLink } from "@/components/ui";

type Source = {
  title?: string;
  source?: string;
  score?: number;
  excerpt?: string;
};

type DashLink = {
  href: string;
  label: string;
};

type Msg = {
  role: "user" | "assistant";
  text: string;
  link?: DashLink | null;
  sources?: Source[];
};

const SUGGESTIONS = [
  "Quanti abitanti ha San Vincenzo?",
  "Dove trovo i luoghi accessibili?",
  "Qual è la capienza del porto?",
  "Quante colonnine EV ci sono?",
  "Quanto costa ricaricare l'auto elettrica?",
  "Dove trovo i prezzi dei carburanti?",
  "Orari autobus e treni?",
  "Dove sono le allerte Protezione Civile?",
];

export default function AssistenteChat({
  compact = false,
}: {
  compact?: boolean;
}) {
  const t = useT();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Ciao: copro tutto il cruscotto (demografia, turismo, porto, mobilità, disabilità/accessibilità, economia, finanza, ambiente, sanità, meteo…). Rispondo con il dato o il link alla sezione. Niente testi inventati.",
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
        link?: DashLink | null;
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
        {
          role: "assistant",
          text,
          link: data.link ?? null,
          sources: data.sources,
        },
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
            {compact
              ? t(s)
                  .replace(" in San Vincenzo?", "?")
                  .replace(" a San Vincenzo?", "?")
                  .slice(0, 48)
              : t(s)}
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
              <p className="m-0 whitespace-pre-wrap">{t(m.text)}</p>
              {m.link?.href ? (
                <div className="mt-2">
                  <SolidLink href={m.link.href} external={false}>
                    {t(m.link.label)}
                  </SolidLink>
                </div>
              ) : null}
              {m.sources && m.sources.length > 0 && !m.link ? (
                <ul className="mb-0 mt-2 list-disc pl-4 text-xs text-[var(--pa-muted)]">
                  {m.sources.slice(0, 2).map((s, j) => (
                    <li key={j}>
                      <strong>{s.title || s.source}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {loading ? (
            <LoadingBlock label={t("Generazione risposta…")} />
          ) : null}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 border-t border-[var(--pa-border)] bg-white p-3 sm:flex-row sm:items-end"
        >
          <label className="m-0 flex-1 text-sm">
            <span className="mb-1 block text-[var(--pa-muted)]">
              {t("La tua domanda")}
            </span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={compact ? 2 : 2}
              className="w-full resize-y rounded-lg border border-[var(--pa-border)] px-3 py-2 text-[var(--pa-ink)]"
              placeholder={t("Es. Luoghi accessibili? Orari bus? Prezzi EV?")}
              disabled={loading}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--pa-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--pa-primary-hover)] disabled:opacity-50"
            style={{ color: "#ffffff" }}
          >
            {t("Chiedi")}
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
        title={t("Assistente (RAG)")}
        description={t(
          "Risponde con il dato richiesto o con il link alla sezione del cruscotto. Niente testi inventati.",
        )}
      />
      {chatBody}
      <p className="mt-3 text-xs text-[var(--pa-muted)]">
        Domande note → risposta locale. Altre → RAG su Modal (Hugging Face).
      </p>
    </section>
  );
}
