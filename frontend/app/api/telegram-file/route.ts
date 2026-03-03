import TelegramBot from "node-telegram-bot-api";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const fileLinkCache = new Map<string, { link: string; exp: number }>();
const FILE_LINK_TTL_MS = 10 * 60 * 1000;

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

function describeTelegramError(e: unknown) {
  const tokenLike = /bot\d+:[A-Za-z0-9_-]+/g;
  const scrub = (s: string) => s.replace(tokenLike, "bot***").slice(0, 180);
  if (!e || typeof e !== "object") return "";
  const rec = e as Record<string, unknown>;
  const code = typeof rec.code === "string" ? rec.code : "";
  const response = rec.response && typeof rec.response === "object" ? (rec.response as Record<string, unknown>) : null;
  const body = response?.body && typeof response.body === "object" ? (response.body as Record<string, unknown>) : null;
  const errorCode =
    typeof body?.error_code === "number"
      ? String(body.error_code)
      : typeof body?.error_code === "string"
        ? body.error_code
        : "";
  const description = typeof body?.description === "string" ? body.description : "";
  const message = !description && typeof rec.message === "string" ? rec.message : "";
  const out = [code, errorCode, description || message].map((v) => (v || "").trim()).filter(Boolean).join(" ");
  return out ? scrub(out) : "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileId = (url.searchParams.get("fileId") || "").trim();
  if (!fileId || fileId.length > 512) {
    return new Response("Bad Request", { status: 400 });
  }

  const fallback = async (reason: string, extraHeaders?: Record<string, string>) => {
    const headers = new Headers();
    headers.set("cache-control", "no-store");
    headers.set("x-image-fallback", reason);
    if (extraHeaders) {
      for (const [k, v] of Object.entries(extraHeaders)) {
        if (k && v) headers.set(k, v);
      }
    }
    try {
      const filePath = path.join(process.cwd(), "public", "ban.png");
      const buf = await fs.readFile(filePath);
      headers.set("content-type", "image/png");
      return new Response(buf, { status: 200, headers });
    } catch {
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">` +
        `<rect width="100%" height="100%" fill="#e5e7eb"/>` +
        `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="48">no image</text>` +
        `</svg>`;
      headers.set("content-type", "image/svg+xml; charset=utf-8");
      return new Response(svg, { status: 200, headers });
    }
  };

  const token = (process.env.TELEGRAM_BOT_TOKEN || process.env.TG_TOKEN || "").trim();
  if (!token) {
    return fallback("no_token");
  }

  let fileLink = "";
  const now = Date.now();
  const cached = fileLinkCache.get(fileId);
  if (cached && cached.exp > now) {
    fileLink = cached.link;
  } else {
    try {
      const bot = new TelegramBot(token, { polling: false });
      fileLink = await bot.getFileLink(fileId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      const reason = msg && /429/.test(msg) ? "get_file_link_429" : "get_file_link_failed";
      const diag = describeTelegramError(e);
      return fallback(reason, diag ? { "x-telegram-error": diag } : undefined);
    }
    if (fileLinkCache.size > 2000) fileLinkCache.clear();
    fileLinkCache.set(fileId, { link: fileLink, exp: now + FILE_LINK_TTL_MS });
  }

  let upstream: Response | null = null;
  try {
    upstream = await fetch(fileLink, { cache: "no-store" });
  } catch {
    return fallback("fetch_failed");
  }
  if (!upstream.ok || !upstream.body) {
    return fallback(`upstream_${upstream?.status || 0}`);
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
