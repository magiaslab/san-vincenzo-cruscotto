import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SostieniPanel } from "@/components/SostieniPanel";
import { isSostieniEnabled } from "@/lib/sostieni";

export default function SostieniPage() {
  if (!isSostieniEnabled()) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header brandAsHeading={false} />
      <main id="contenuto-principale" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <SostieniPanel asPage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
