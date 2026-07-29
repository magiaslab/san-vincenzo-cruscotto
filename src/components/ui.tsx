import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { isMissing } from "@/lib/format";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  unavailable?: boolean;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  /** Destinazione del dettaglio (es. etichetta tab). */
  detailLabel?: string;
  onDetail?: () => void;
};

export function KpiCard({ 
  label, 
  value, 
  hint, 
  unavailable, 
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  detailLabel,
  onDetail,
}: KpiCardProps) {
  const empty =
    unavailable ||
    value === null ||
    value === undefined ||
    (typeof value === "string" && (value === "n.d." || value === ""));

  const variantStyles = {
    default: "border-[#d9e6f2] bg-white",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    danger: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
  };

  const iconColor = {
    default: "text-[#0066CC]",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
    info: "text-blue-600",
  };

  const clickable = typeof onDetail === "function";
  const className = `rounded-lg border p-3 shadow-sm sm:p-4 text-left w-full ${variantStyles[variant]} ${
    clickable
      ? "cursor-pointer transition hover:border-[#0066CC] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066CC]"
      : ""
  }`;

  const body = (
    <>
      <div className="flex items-start justify-between">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[#5b6f82]">
          {label}
        </p>
        {Icon && (
          <Icon 
            size={20} 
            className={`shrink-0 ${iconColor[variant]}`} 
            strokeWidth={2}
          />
        )}
      </div>
      <div className="mt-1.5 flex items-end justify-between sm:mt-2">
        <p className="m-0 text-xl font-bold text-[#17324d] sm:text-2xl">
          {empty ? (
            <span className="flex items-center gap-1 text-base text-[#5b6f82]">
              <AlertCircle size={16} />
              <span>dato non disponibile</span>
            </span>
          ) : (
            value
          )}
        </p>
        {trend && !empty && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${
            trend === "up" ? "text-green-600" : 
            trend === "down" ? "text-red-600" : 
            "text-[#5b6f82]"
          }`}>
            {trend === "up" && <TrendingUp size={14} />}
            {trend === "down" && <TrendingDown size={14} />}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
      {hint ? (
        <p className="m-0 mt-1.5 text-xs text-[#5b6f82] sm:mt-2">{hint}</p>
      ) : null}
      {clickable ? (
        <p className="m-0 mt-2 text-xs font-semibold text-[#0066CC]">
          {detailLabel ? `Vai a ${detailLabel} →` : "Vai al dettaglio →"}
        </p>
      ) : null}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        className={className}
        onClick={onDetail}
        aria-label={
          detailLabel
            ? `${label}: vai alla sezione ${detailLabel}`
            : `${label}: vai al dettaglio`
        }
      >
        {body}
      </button>
    );
  }

  return <article className={className}>{body}</article>;
}

export function SectionIntro({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 sm:mb-5">
      <h2 className="m-0 text-lg font-bold text-[#17324d] sm:text-xl">{title}</h2>
      {description ? (
        <p className="m-0 mt-1 text-xs text-[#5b6f82] sm:text-sm">{description}</p>
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
