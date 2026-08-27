import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RiusaPanel } from "@/components/RiusaPanel";

export default function RiusaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header brandAsHeading={false} />
      <main id="contenuto-principale" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <RiusaPanel asPage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
