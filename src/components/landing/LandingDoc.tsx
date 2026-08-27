import type { ReactNode } from "react";

export function LandingDoc({
  kicker,
  title,
  lede,
  children,
}: {
  kicker?: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {kicker ? (
        <p className="m-0 text-sm font-semibold uppercase tracking-wide text-[var(--pa-primary)]">
          {kicker}
        </p>
      ) : null}
      <h1 className="mb-4 mt-1 text-3xl font-bold leading-tight text-[var(--pa-ink)] sm:text-4xl">
        {title}
      </h1>
      <p className="mb-8 text-lg leading-relaxed text-[var(--pa-muted)]">{lede}</p>
      <div className="space-y-8 text-sm leading-relaxed text-[var(--pa-ink)] sm:text-base">
        {children}
      </div>
    </article>
  );
}
