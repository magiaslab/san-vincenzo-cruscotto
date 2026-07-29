import { DashboardTabs } from "@/components/DashboardTabs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCachedKpi } from "@/lib/dashboard";

export const revalidate = 86400;

export default async function Home() {
  let kpi: Record<string, unknown> = {};
  let error: string | null = null;

  try {
    kpi = await getCachedKpi();
  } catch (err) {
    console.error(err);
    error =
      "Non è stato possibile recuperare i KPI da Cruscotto Italia. Riprova più tardi.";
  }

  const generatedAt =
    typeof kpi._generated_at === "string" ? kpi._generated_at : null;

  if (error) {
    return (
      <>
        <Header generatedAt={generatedAt} />
        <main className="flex-1">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="rounded-lg border border-[#d9364f] bg-[#fce8eb] p-4 text-[#17324d]">
              {error}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return <DashboardTabs kpi={kpi} generatedAt={generatedAt} />;
}
