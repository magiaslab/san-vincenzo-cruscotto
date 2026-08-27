import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/** Chrome delle pagine isolate (Riusa, Sostieni, Attribuzioni, …). */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header brandAsHeading={false} />
      <main id="contenuto-principale" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
