import { RiusaPanel } from "@/components/RiusaPanel";
import { SiteChrome } from "@/components/SiteChrome";

export default function RiusaPage() {
  return (
    <SiteChrome>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <RiusaPanel />
      </div>
    </SiteChrome>
  );
}
