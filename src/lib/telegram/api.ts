/**
 * Client minimo Bot API Telegram (no dipendenze esterne).
 */

const API = "https://api.telegram.org";

export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
};

export type TelegramChat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
};

export type TelegramLocation = {
  latitude: number;
  longitude: number;
};

export type TelegramMessage = {
  message_id: number;
  date: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  caption?: string;
  location?: TelegramLocation;
  reply_to_message?: TelegramMessage;
  photo?: Array<{ file_id: string; width: number; height: number }>;
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type TgResponse<T> = { ok: boolean; result?: T; description?: string };

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN mancante");
  return t;
}

export async function tg<T>(
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as TgResponse<T>;
  if (!json.ok) {
    throw new Error(json.description || `Telegram ${method} failed`);
  }
  return json.result as T;
}

export async function sendMessage(
  chatId: number,
  text: string,
  extra?: Record<string, unknown>,
) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

export async function answerCallbackQuery(id: string, text?: string) {
  return tg("answerCallbackQuery", {
    callback_query_id: id,
    text,
    show_alert: false,
  });
}

export function parseAdminChatIds(): number[] {
  const raw = process.env.TELEGRAM_ADMIN_CHAT_IDS?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}
