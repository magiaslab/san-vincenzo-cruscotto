/**
 * Logica conversazionale del bot DAE (stateless: coord nella reply).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { OPENAEDMAP_URL } from "@/lib/constants";
import {
  answerCallbackQuery,
  parseAdminChatIds,
  sendMessage,
  type TelegramCallbackQuery,
  type TelegramMessage,
  type TelegramUpdate,
} from "@/lib/telegram/api";
import {
  approvedOnly,
  readSegnalazioni,
  setSegnalazioneStatus,
  upsertSegnalazione,
} from "@/lib/telegram/store";
import {
  decodeCoordMarker,
  encodeCoordMarker,
  haversineM,
  inDaeBbox,
  newSegnalazioneId,
  type DaeSegnalazioneFeature,
} from "@/lib/telegram/types";

const CRUSCOTTO_SANITA =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.cruscottosanvincenzo.it";

function helpText(): string {
  return [
    "<b>Bot DAE San Vincenzo</b>",
    "",
    "Segnala un defibrillatore (DAE) mancante sulla mappa open data.",
    "In emergenza chiama sempre il <b>118</b>.",
    "",
    "Comandi:",
    "/nuovo — avvia una segnalazione",
    "/vicini — DAE già mappati vicino a te",
    "/annulla — esci dalla procedura",
    "/aiuto — questo messaggio",
    "",
    `Mappa sul cruscotto: ${CRUSCOTTO_SANITA}/#sanita`,
    `OpenAEDMap: ${OPENAEDMAP_URL}`,
  ].join("\n");
}

const locationKeyboard = {
  keyboard: [
    [{ text: "📍 Invia posizione attuale", request_location: true }],
    [{ text: "Annulla" }],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
};

async function loadOsmDae(): Promise<
  Array<{ lat: number; lon: number; nome: string }>
> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public/data/dae-san-vincenzo.geojson"),
      "utf8",
    );
    const json = JSON.parse(raw) as {
      features?: Array<{
        geometry?: { coordinates?: number[] };
        properties?: { nome?: string };
      }>;
    };
    const out: Array<{ lat: number; lon: number; nome: string }> = [];
    for (const f of json.features ?? []) {
      const c = f.geometry?.coordinates;
      if (!c || c.length < 2) continue;
      out.push({
        lon: c[0],
        lat: c[1],
        nome: String(f.properties?.nome ?? "DAE"),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function notifyAdmins(text: string, replyMarkup?: unknown) {
  const ids = parseAdminChatIds();
  if (ids.length === 0) return false;
  await Promise.all(
    ids.map((id) =>
      sendMessage(
        id,
        text,
        replyMarkup ? { reply_markup: replyMarkup } : undefined,
      ).catch((err) => console.error("notify admin", id, err)),
    ),
  );
  return true;
}

function isAdmin(userId: number, chatId: number): boolean {
  const ids = parseAdminChatIds();
  if (ids.length === 0) return false;
  return ids.includes(userId) || ids.includes(chatId);
}

async function handleStart(msg: TelegramMessage) {
  await sendMessage(msg.chat.id, helpText(), {
    reply_markup: { remove_keyboard: true },
  });
}

async function askLocation(msg: TelegramMessage, intro: string) {
  await sendMessage(msg.chat.id, intro, { reply_markup: locationKeyboard });
}

async function handleLocation(msg: TelegramMessage) {
  const loc = msg.location;
  if (!loc) return;
  const { latitude: lat, longitude: lon } = loc;

  if (!inDaeBbox(lat, lon)) {
    await sendMessage(
      msg.chat.id,
      "Questa posizione sembra fuori da San Vincenzo. Avvicinati al DAE e riprova con /nuovo.",
      { reply_markup: { remove_keyboard: true } },
    );
    return;
  }

  const osm = await loadOsmDae();
  const seg = approvedOnly(await readSegnalazioni()).features;
  const all = [
    ...osm.map((p) => ({ ...p, fonte: "OSM" as const })),
    ...seg.map((f) => ({
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      nome: f.properties.nome,
      fonte: "segnalazione" as const,
    })),
  ]
    .map((p) => ({
      ...p,
      d: haversineM(lat, lon, p.lat, p.lon),
    }))
    .sort((a, b) => a.d - b.d);

  const near = all.filter((p) => p.d <= 80).slice(0, 5);
  const nearBlock =
    near.length > 0
      ? [
          "",
          "<b>DAE già noti qui intorno:</b>",
          ...near.map(
            (p) => `• ${p.nome} — ~${Math.round(p.d)} m (${p.fonte})`,
          ),
          near.some((p) => p.d <= 40)
            ? "⚠️ Molto vicino a un punto esistente: se è lo stesso apparecchio, /annulla."
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "\nNessun DAE noto entro 80 m.";

  const marker = encodeCoordMarker(lat, lon);
  await sendMessage(
    msg.chat.id,
    [
      `Posizione: <code>${lat.toFixed(5)}, ${lon.toFixed(5)}</code>`,
      marker,
      nearBlock,
      "",
      "Per <b>segnalare un nuovo DAE</b> qui, descrivi l’ubicazione rispondendo a <b>questo</b> messaggio (es. «ingresso municipio, a sinistra»).",
      "Altrimenti /annulla.",
    ].join("\n"),
    {
      reply_markup: {
        force_reply: true,
        selective: true,
        input_field_placeholder: "Es. ingresso farmacia",
      },
    },
  );
}

async function handleUbicazioneReply(msg: TelegramMessage) {
  const parent = msg.reply_to_message;
  if (!parent?.text || !msg.text) return false;
  const coords = decodeCoordMarker(parent.text);
  if (!coords) return false;

  const ubicazione = msg.text.trim();
  if (ubicazione.length < 3) {
    await sendMessage(
      msg.chat.id,
      "Scrivi una descrizione un po’ più lunga (min. 3 caratteri).",
    );
    return true;
  }
  if (/^annulla$/i.test(ubicazione)) {
    await sendMessage(msg.chat.id, "Segnalazione annullata.", {
      reply_markup: { remove_keyboard: true },
    });
    return true;
  }

  const id = newSegnalazioneId();
  const from = msg.from;
  const feature: DaeSegnalazioneFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [coords.lon, coords.lat],
    },
    properties: {
      id,
      status: "pending",
      nome: ubicazione.slice(0, 80),
      ubicazione,
      accesso: "",
      indoor: false,
      telegram_user_id: from?.id ?? 0,
      telegram_username: from?.username,
      created_at: new Date().toISOString(),
      osm_url: `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=18/${coords.lat}/${coords.lon}`,
    },
  };

  const saved = await upsertSegnalazione(feature);

  const adminText = [
    "<b>Nuova segnalazione DAE</b>",
    `ID: <code>${id}</code>`,
    `Ubicazione: ${ubicazione}`,
    `Coord: <code>${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}</code>`,
    from?.username
      ? `Da: @${from.username} (<code>${from.id}</code>)`
      : `Da: <code>${from?.id ?? "?"}</code>`,
    `Salvataggio: ${saved.via}`,
    `OSM: ${feature.properties.osm_url}`,
    `OpenAEDMap: ${OPENAEDMAP_URL}`,
  ].join("\n");

  const notified = await notifyAdmins(adminText, {
    inline_keyboard: [
      [
        { text: "✅ Approva overlay", callback_data: `dae:ok:${id}` },
        { text: "❌ Rifiuta", callback_data: `dae:no:${id}` },
      ],
      [{ text: "🗺️ Apri mappa", url: feature.properties.osm_url }],
    ],
  });

  await sendMessage(
    msg.chat.id,
    [
      "Grazie! Segnalazione inviata",
      notified
        ? "e in coda di moderazione."
        : "(moderatori non ancora configurati: resta in pending sul server).",
      "",
      `ID: <code>${id}</code>`,
      "Quando sarà approvata potrà comparire sul cruscotto; per OpenAEDMap va ancora pubblicata su OpenStreetMap.",
    ].join("\n"),
    { reply_markup: { remove_keyboard: true } },
  );
  return true;
}

async function handleCallback(cq: TelegramCallbackQuery) {
  const data = cq.data ?? "";
  const m = data.match(/^dae:(ok|no):(.+)$/);
  if (!m || !cq.message) {
    await answerCallbackQuery(cq.id);
    return;
  }
  const chatId = cq.message.chat.id;
  if (!isAdmin(cq.from.id, chatId)) {
    await answerCallbackQuery(cq.id, "Solo moderatori");
    return;
  }
  const [, action, id] = m;
  const status = action === "ok" ? "approved_overlay" : "rejected";
  const feat = await setSegnalazioneStatus(id, status);
  if (!feat) {
    await answerCallbackQuery(cq.id, "Segnalazione non trovata");
    await sendMessage(
      chatId,
      `Segnalazione <code>${id}</code> non trovata nello store.`,
    );
    return;
  }
  await answerCallbackQuery(
    cq.id,
    action === "ok" ? "Approvata" : "Rifiutata",
  );
  await sendMessage(
    chatId,
    action === "ok"
      ? `✅ <code>${id}</code> approvata per overlay cruscotto.\nPer OpenAEDMap: aggiungila su OSM → poi npm run dae:sync.`
      : `❌ <code>${id}</code> rifiutata.`,
  );
  if (feat.properties.telegram_user_id) {
    await sendMessage(
      feat.properties.telegram_user_id,
      action === "ok"
        ? `La tua segnalazione DAE <code>${id}</code> è stata approvata e potrà comparire sul cruscotto.`
        : `La tua segnalazione DAE <code>${id}</code> non è stata accettata.`,
    ).catch(() => undefined);
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
  const msg = update.message;
  if (!msg) return;

  const text = (msg.text ?? "").trim();

  if (text === "Annulla" || /^\/annulla\b/i.test(text)) {
    await sendMessage(msg.chat.id, "Ok, procedura annullata.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  if (
    /^\/start\b/i.test(text) ||
    /^\/aiuto\b/i.test(text) ||
    /^\/help\b/i.test(text)
  ) {
    await handleStart(msg);
    return;
  }

  if (/^\/nuovo\b/i.test(text)) {
    await askLocation(
      msg,
      [
        "Per segnalare un DAE, inviami la <b>posizione</b> (pulsante qui sotto oppure graffetta → Posizione).",
        "",
        "Deve essere nel territorio di San Vincenzo (LI).",
      ].join("\n"),
    );
    return;
  }

  if (/^\/vicini\b/i.test(text)) {
    await askLocation(
      msg,
      "Invia la tua <b>posizione</b>: ti elenco i DAE già noti e potrai segnalarne uno nuovo rispondendo al messaggio.",
    );
    return;
  }

  if (msg.reply_to_message && msg.text) {
    const handled = await handleUbicazioneReply(msg);
    if (handled) return;
  }

  if (msg.location) {
    await handleLocation(msg);
    return;
  }

  if (text.startsWith("/")) {
    await sendMessage(msg.chat.id, "Comando non riconosciuto. Prova /aiuto");
  }
}
