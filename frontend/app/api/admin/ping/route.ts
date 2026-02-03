import { NextResponse } from "next/server";

function isAdminAuthorized(request: Request) {
  const secret = (process.env.ADMIN_SECRET || "").trim();
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

export async function GET(request: Request) {
  const secret = (process.env.ADMIN_SECRET || "").trim();
  const pass = (process.env.ADMIN_PASSWORD || "").trim();
  if (!secret && !pass) {
    return NextResponse.json(
      {
        ok: false,
        error: "Админка не настроена: задай ADMIN_SECRET или ADMIN_PASSWORD в переменных окружения"
      },
      { status: 501, headers: { "cache-control": "no-store" } }
    );
  }
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403, headers: { "cache-control": "no-store" } }
    );
  }
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
