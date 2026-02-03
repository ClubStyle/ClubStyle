import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

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
  const pass = (process.env.ADMIN_PASSWORD || "6789").trim();
  const reqUser = (request.headers.get("x-admin-user") || "").trim();
  const reqPass = (request.headers.get("x-admin-pass") || "").trim();
  return reqUser === user && reqPass === pass;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function sanitizeFilename(name: string) {
  const base = name.split("/").pop() || "file";
  const cleaned = base.replace(/[^\w.\-]+/g, "_");
  return cleaned.length ? cleaned : "file";
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers: { "cache-control": "no-store" } });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return Response.json(
      { error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: 'Expected multipart/form-data with "file"' },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const bucket = (process.env.SUPABASE_UPLOADS_BUCKET || "uploads").trim() || "uploads";
  const originalName = sanitizeFilename(file.name || "file");
  const key = `materials/${Date.now()}-${crypto.randomUUID()}-${originalName}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  const { error: uploadError } = await supabase.storage.from(bucket).upload(key, bytes, {
    contentType,
    upsert: false
  });

  if (uploadError) {
    return Response.json(
      { error: uploadError.message },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  const url = data?.publicUrl;
  if (!url) {
    return Response.json(
      { error: "Failed to generate public url" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  return Response.json({ url, path: key }, { headers: { "cache-control": "no-store" } });
}

