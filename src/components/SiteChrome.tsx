import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LandingShell } from "@/components/landing/LandingShell";
import { isLandingSite } from "@/lib/comune-config";

/** Chrome del minisito (landing) oppure header/footer del cruscotto comunale. */
export function SiteChrome({ children }: { children: ReactNode }) {
  if (isLandingSite()) {
    return <LandingShell>{children}</LandingShell>;
  }
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
