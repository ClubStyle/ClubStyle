import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function computeTelegramWebAppHash(dataCheckString: string, botToken: string) {
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  return crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
}

export async function POST(req: Request) {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) {
    return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as null | { initData?: unknown };
  const initData = typeof body?.initData === "string" ? body.initData.trim() : "";
  if (!initData) {
    return Response.json({ ok: false, error: "initData is required" }, { status: 400 });
  }

  const params = new URLSearchParams(initData);
  const providedHash = (params.get("hash") || "").trim();
  if (!providedHash) {
    return Response.json({ ok: false, error: "hash is missing" }, { status: 400 });
  }

  params.delete("hash");
  const pairs = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join("\n");
  const expectedHash = computeTelegramWebAppHash(dataCheckString, token);
  if (expectedHash !== providedHash) {
    return Response.json({ ok: false, error: "invalid hash" }, { status: 401 });
  }

  const authDate = Number(params.get("auth_date") || "0") || 0;
  const maxAgeSeconds = 24 * 60 * 60;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (authDate > 0 && nowSeconds - authDate > maxAgeSeconds) {
    return Response.json({ ok: false, error: "initData is too old" }, { status: 401 });
  }

  const userParam = params.get("user");
  const userParsed = typeof userParam === "string" ? safeJsonParse(userParam) : null;
  const user = userParsed && typeof userParsed === "object" ? userParsed : null;

  return Response.json({ ok: true, user });
}

