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
  const version =
    (process.env.VERCEL_GIT_COMMIT_SHA || "").trim() ||
    (process.env.GIT_COMMIT_SHA || "").trim() ||
    null;
  const ref =
    (process.env.VERCEL_GIT_COMMIT_REF || "").trim() ||
    (process.env.GIT_BRANCH || "").trim() ||
    null;
  const supabaseUrlPresent = Boolean((process.env.SUPABASE_URL || "").trim());
  const supabaseKeyPresent = Boolean(
    (process.env.SUPABASE_SECRET_KEY || "").trim() ||
      (process.env.SUPABASE_SECRET_DEFAULT_KEY || "").trim() ||
      (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim() ||
      (process.env.SUPABASE_PUBLISHABLE_KEY || "").trim() ||
      (process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || "").trim() ||
      (process.env.SUPABASE_ANON_KEY || "").trim()
  );
  const uploadsBucket = (process.env.SUPABASE_UPLOADS_BUCKET || "uploads").trim() || "uploads";
  return NextResponse.json(
    {
      ok: true,
      version,
      ref,
      at: Date.now(),
      vercel: Boolean(process.env.VERCEL),
      supabaseUrlPresent,
      supabaseKeyPresent,
      uploadsBucket
    },
    { headers: { "cache-control": "no-store" } }
  );
}
