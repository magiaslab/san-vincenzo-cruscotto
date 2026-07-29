import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ISTAT_CODE, MCP_ENDPOINT } from "./constants";

type McpContent = { type: string; text?: string };

function extractJson<T>(result: { content?: McpContent[] }): T {
  const text = (result.content ?? [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("");
  if (!text) {
    throw new Error("Risposta MCP vuota");
  }
  return JSON.parse(text) as T;
}

/**
 * Client MCP verso Cruscotto Italia (AgID).
 * Ogni chiamata apre una sessione breve: l'endpoint pubblico è stateless-friendly.
 */
export async function callMcpTool<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_ENDPOINT));
  const client = new Client({ name: "cruscotto-san-vincenzo", version: "1.0.0" });

  try {
    await client.connect(transport);
    const result = await client.callTool({ name, arguments: args });
    if ("isError" in result && result.isError) {
      const msg = extractJson<{ error?: string }>(result as { content?: McpContent[] });
      throw new Error(msg?.error ?? `Tool MCP ${name} ha restituito un errore`);
    }
    return extractJson<T>(result as { content?: McpContent[] });
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }
}

/** Fallback HTTP diretto se l'SDK fallisce (es. edge runtime). */
export async function callMcpToolHttp<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`MCP HTTP ${res.status}`);
  }

  const raw = await res.text();
  let obj: { result?: { content?: McpContent[] }; error?: { message?: string } };
  if (raw.startsWith("data:")) {
    const line = raw.split("\n").find((l) => l.startsWith("data: "));
    obj = JSON.parse(line!.slice(6));
  } else {
    obj = JSON.parse(raw);
  }
  if (obj.error) {
    throw new Error(obj.error.message ?? "Errore MCP");
  }
  return extractJson<T>(obj.result ?? {});
}

export async function fetchComuneKpi() {
  try {
    return await callMcpTool<Record<string, unknown>>("comune_kpi", {
      istat_code: ISTAT_CODE,
    });
  } catch {
    return callMcpToolHttp<Record<string, unknown>>("comune_kpi", {
      istat_code: ISTAT_CODE,
    });
  }
}

export async function fetchComuneDashboard() {
  try {
    return await callMcpTool<Record<string, unknown>>("comune_dashboard", {
      istat_code: ISTAT_CODE,
    });
  } catch {
    return callMcpToolHttp<Record<string, unknown>>("comune_dashboard", {
      istat_code: ISTAT_CODE,
    });
  }
}
