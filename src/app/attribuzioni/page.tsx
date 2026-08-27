import { AttribuzioniPanel } from "@/components/AttribuzioniPanel";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function AttribuzioniPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header brandAsHeading={false} />
      <main id="contenuto-principale" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <AttribuzioniPanel asPage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
