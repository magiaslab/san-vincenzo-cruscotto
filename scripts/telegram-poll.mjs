#!/usr/bin/env node
/**
 * Long-polling locale per testare il bot senza webhook pubblico.
 * Uso: npm run telegram:poll
 */
const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("Serve TELEGRAM_BOT_TOKEN in env / .env.local");
  process.exit(1);
}

const base = `https://api.telegram.org/bot${token}`;
let offset = 0;

async function forward(update) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const url =
    process.env.TELEGRAM_POLL_TARGET?.trim() ||
    "http://127.0.0.1:3000/api/telegram/webhook";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Telegram-Bot-Api-Secret-Token": secret } : {}),
    },
    body: JSON.stringify(update),
  });
  const text = await res.text();
  console.log(
    new Date().toISOString(),
    "update",
    update.update_id,
    res.status,
    text,
  );
}

console.log(
  "Polling Telegram →",
  process.env.TELEGRAM_POLL_TARGET ||
    "http://127.0.0.1:3000/api/telegram/webhook",
);
console.log("Apri t.me/DaesanvincenzoBot e invia /start");

for (;;) {
  const res = await fetch(
    `${base}/getUpdates?timeout=25&offset=${offset}&allowed_updates=${encodeURIComponent(JSON.stringify(["message", "callback_query"]))}`,
  );
  const json = await res.json();
  if (!json.ok) {
    console.error(json);
    await new Promise((r) => setTimeout(r, 3000));
    continue;
  }
  for (const update of json.result) {
    offset = update.update_id + 1;
    try {
      await forward(update);
    } catch (err) {
      console.error("forward failed", err);
    }
  }
}
