import { COMUNE } from "@/lib/comune-config";
import { HTTP_USER_AGENT } from "@/lib/constants";

export async function fetchUa(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 20_000, headers, ...rest } = init;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...rest,
      signal: ac.signal,
      headers: {
        "User-Agent": HTTP_USER_AGENT || COMUNE.brand.user_agent,
        Accept: "*/*",
        ...headers,
      },
    });
  } finally {
    clearTimeout(t);
  }
}
