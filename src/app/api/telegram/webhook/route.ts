import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/lib/telegram/api";
import { handleTelegramUpdate } from "@/lib/telegram/bot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Webhook Bot API Telegram per segnalazioni DAE.
 * Header richiesto: X-Telegram-Bot-Api-Secret-Token == TELEGRAM_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN non configurato" },
      { status: 503 },
    );
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  try {
    await handleTelegramUpdate(update);
  } catch (err) {
    console.error("telegram webhook error", err);
    // 200 per evitare retry aggressivi su errori applicativi.
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    service: "dae-telegram-webhook",
    bot: process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || "",
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
  });
}
