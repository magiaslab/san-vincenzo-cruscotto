import { redirect } from "next/navigation";
import { isLandingSite } from "@/lib/comune-config";
import ComeFunzionaRedirect from "./redirect-client";

export default function ComeFunzionaPage() {
  if (isLandingSite()) redirect("/progetto");
  return <ComeFunzionaRedirect />;
}
