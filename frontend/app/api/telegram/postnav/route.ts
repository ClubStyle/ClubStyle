import TelegramBot from "node-telegram-bot-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isAdminAuthorized(request: Request) {
  const secret =
    (process.env.ADMIN_SECRET || "").trim() || (process.env.SYNC_TELEGRAM_SECRET || "").trim();
  const auth = (request.headers.get("authorization") || "").trim();
  if (secret) {
    if (auth === secret) return true;
    if (auth.toLowerCase().startsWith("bearer ")) {
      const token = auth.slice("bearer ".length).trim();
      if (token === secret) return true;
    }
  }

  const user = (process.env.ADMIN_USER || "h1").trim();
  const pass = (process.env.ADMIN_PASSWORD || "").trim();
  if (!pass) return false;
  const reqUser = (request.headers.get("x-admin-user") || "").trim();
  const reqPass = (request.headers.get("x-admin-pass") || "").trim();
  return reqUser === user && reqPass === pass;
}

function getTelegramConfig() {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const rawChatId = (process.env.TELEGRAM_TARGET_CHAT_ID || "").trim();
  const chatId = rawChatId ? Number(rawChatId) : -1002055411531;
  const webAppUrl = (process.env.TELEGRAM_WEBAPP_URL || "").trim();
  return {
    token,
    chatId: Number.isFinite(chatId) && chatId !== 0 ? chatId : -1002055411531,
    webAppUrl
  };
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const cfg = getTelegramConfig();
  if (!cfg.token) {
    return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is required" }, { status: 500 });
  }
  if (!cfg.webAppUrl) {
    return Response.json({ ok: false, error: "TELEGRAM_WEBAPP_URL is required" }, { status: 500 });
  }

  let parsed: URL;
  try {
    parsed = new URL(cfg.webAppUrl);
  } catch {
    return Response.json({ ok: false, error: "TELEGRAM_WEBAPP_URL must be a valid URL" }, { status: 500 });
  }
  if (parsed.protocol !== "https:") {
    return Response.json({ ok: false, error: "TELEGRAM_WEBAPP_URL must be https" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as
    | null
    | { text?: unknown; buttonText?: unknown; pin?: unknown; chatId?: unknown; webAppUrl?: unknown };

  const text = typeof body?.text === "string" && body.text.trim().length ? body.text.trim() : "Навигация по каналу";
  const buttonText =
    typeof body?.buttonText === "string" && body.buttonText.trim().length ? body.buttonText.trim() : "Открыть";
  const pin = typeof body?.pin === "boolean" ? body.pin : true;

  const chatId =
    typeof body?.chatId === "string" && body.chatId.trim().length
      ? body.chatId.trim()
      : typeof body?.chatId === "number" && Number.isFinite(body.chatId) && body.chatId !== 0
        ? body.chatId
        : cfg.chatId;

  const webAppUrl =
    typeof body?.webAppUrl === "string" && body.webAppUrl.trim().length ? body.webAppUrl.trim() : cfg.webAppUrl;

  const bot = new TelegramBot(cfg.token, { polling: false });
  const msg = await bot.sendMessage(chatId as never, text, {
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[{ text: buttonText, web_app: { url: webAppUrl } }]]
    }
  });

  if (pin) {
    await bot.pinChatMessage(chatId as never, msg.message_id, { disable_notification: true });
  }

  return Response.json({ ok: true, chatId, message_id: msg.message_id, pinned: pin });
}
