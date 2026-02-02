import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileId = (url.searchParams.get("fileId") || "").trim();
  if (!fileId || !/^[A-Za-z0-9_-]+$/.test(fileId)) {
    return new Response("Bad Request", { status: 400 });
  }

  if (!token) {
    return new Response("TELEGRAM_BOT_TOKEN is not set", { status: 500 });
  }

  const bot = new TelegramBot(token, { polling: false });
  const fileLink = await bot.getFileLink(fileId);

  const upstream = await fetch(fileLink, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(upstream.body, { status: 200, headers });
}
