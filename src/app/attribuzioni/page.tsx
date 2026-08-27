import { redirect } from "next/navigation";
import { isLandingSite } from "@/lib/comune-config";
import AttribuzioniRedirect from "./redirect-client";

export default function AttribuzioniPage() {
  if (isLandingSite()) redirect("/menzioni");
  return <AttribuzioniRedirect />;
}
