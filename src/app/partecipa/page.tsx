import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PartecipaPanel } from "@/components/PartecipaPanel";

export default function PartecipaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header brandAsHeading={false} />
      <main id="contenuto-principale" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <PartecipaPanel asPage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
