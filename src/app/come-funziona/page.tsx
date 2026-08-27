import { ComeFunzionaPanel } from "@/components/ComeFunzionaPanel";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { buildFaqJsonLd, comeFunzionaFaq } from "@/lib/seo";

export default function ComeFunzionaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <JsonLd
        id="jsonld-faq-come-funziona"
        data={buildFaqJsonLd(comeFunzionaFaq())}
      />
      <Header brandAsHeading={false} />
      <main id="contenuto-principale" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <ComeFunzionaPanel asPage />
        </div>
      </main>
      <Footer />
    </div>
  );
}
