import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function EmbedsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white p-3 text-[var(--pa-ink)]">{children}</div>
  );
}
