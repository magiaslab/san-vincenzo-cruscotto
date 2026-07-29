import { pwaIconResponse } from "@/lib/pwa-icon";

export const runtime = "edge";

export function GET() {
  return pwaIconResponse(192);
}
