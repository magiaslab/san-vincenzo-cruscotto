import { notFound } from "next/navigation";
import { SostieniPanel } from "@/components/SostieniPanel";
import { SiteChrome } from "@/components/SiteChrome";
import { isSostieniEnabled } from "@/lib/sostieni";

export default function SostieniPage() {
  if (!isSostieniEnabled()) notFound();

  return (
    <SiteChrome>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <SostieniPanel asPage />
      </div>
    </SiteChrome>
  );
}
