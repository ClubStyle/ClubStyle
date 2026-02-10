import TelegramBot from "node-telegram-bot-api";

export const runtime = "nodejs";

function inferImageContentType(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").pop() || "";
    const ext = (last.includes(".") ? last.split(".").pop() : "")?.toLowerCase() || "";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    if (ext === "gif") return "image/gif";
    if (ext === "bmp") return "image/bmp";
    if (ext === "tif" || ext === "tiff") return "image/tiff";
    if (ext === "heic") return "image/heic";
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileId = (url.searchParams.get("fileId") || "").trim();
  if (!fileId || fileId.length > 512) {
    return new Response("Bad Request", { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return new Response("TELEGRAM_BOT_TOKEN is not set", {
      status: 500,
      headers: { "cache-control": "no-store" }
    });
  }

  let fileLink = "";
  try {
    const bot = new TelegramBot(token, { polling: false });
    fileLink = await bot.getFileLink(fileId);
  } catch {
    return new Response("Upstream error", { status: 502, headers: { "cache-control": "no-store" } });
  }

  let upstream: Response | null = null;
  try {
    upstream = await fetch(fileLink, { cache: "no-store" });
  } catch {
    return new Response("Upstream error", { status: 502, headers: { "cache-control": "no-store" } });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502, headers: { "cache-control": "no-store" } });
  }

  const headers = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  const inferredContentType = inferImageContentType(fileLink);
  const contentType =
    inferredContentType ||
    (upstreamContentType && upstreamContentType.startsWith("image/") ? upstreamContentType : null);
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(upstream.body, { status: 200, headers });
}
