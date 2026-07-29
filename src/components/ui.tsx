import type { ReactNode } from "react";
import { isMissing } from "@/lib/format";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  unavailable?: boolean;
};

export function KpiCard({ label, value, hint, unavailable }: KpiCardProps) {
  const empty =
    unavailable ||
    value === null ||
    value === undefined ||
    (typeof value === "string" && (value === "n.d." || value === ""));

  return (
    <article className="rounded-lg border border-[#d9e6f2] bg-white p-4 shadow-sm">
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[#5b6f82]">
        {label}
      </p>
      <p className="m-0 mt-2 text-2xl font-bold text-[#17324d]">
        {empty ? "dato non disponibile" : value}
      </p>
      {hint ? <p className="m-0 mt-2 text-xs text-[#5b6f82]">{hint}</p> : null}
    </article>
  );
}

export function SectionIntro({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="m-0 text-xl font-bold text-[#17324d]">{title}</h2>
      {description ? (
        <p className="m-0 mt-1 text-sm text-[#5b6f82]">{description}</p>
      ) : null}
    </div>
  );
}

export function DataUnavailable({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#c5c7c9] bg-[#f5f6f7] p-4 text-sm text-[#5b6f82]">
      {message ?? "dato non disponibile"}
    </div>
  );
}

export function LoadingBlock({ label = "Caricamento…" }: { label?: string }) {
  return (
    <div className="animate-pulse rounded-lg border border-[#d9e6f2] bg-white p-6 text-sm text-[#5b6f82]">
      {label}
    </div>
  );
}

export function valueOrMissing(
  value: unknown,
  formatter: (v: number) => string,
): string {
  if (isMissing(value) || typeof value !== "number") return "n.d.";
  return formatter(value);
}
