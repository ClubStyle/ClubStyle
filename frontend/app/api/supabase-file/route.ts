import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Database = {
  public: {
    Tables: {
      app_kv: {
        Row: { key: string; value: unknown | null };
        Insert: { key: string; value: unknown | null };
        Update: { key?: string; value?: unknown | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SECRET_DEFAULT_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database, "public">(url, key);
}

function buildPublicObjectUrl(bucket: string, filePath: string) {
  const base = (process.env.SUPABASE_URL || "").trim();
  if (!base) return null;
  try {
    const url = new URL(base);
    const basePath = url.pathname.replace(/\/$/, "");
    url.pathname = `${basePath}/storage/v1/object/public/${bucket}/${filePath}`;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bucket = (url.searchParams.get("bucket") || "").trim();
  const filePath = (url.searchParams.get("path") || "").trim();

  if (!bucket || bucket.length > 128) {
    return new Response("Bad Request", { status: 400, headers: { "cache-control": "no-store" } });
  }
  if (!filePath || filePath.length > 1024) {
    return new Response("Bad Request", { status: 400, headers: { "cache-control": "no-store" } });
  }

  const expectedBucket = (process.env.SUPABASE_UPLOADS_BUCKET || "uploads").trim() || "uploads";
  const allowedBuckets = new Set([expectedBucket, "uploads"]);
  if (!allowedBuckets.has(bucket)) {
    return new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }
  if (filePath.startsWith("/") || filePath.includes("..")) {
    return new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }
  if (!filePath.startsWith("materials/") && !filePath.startsWith("telegram/")) {
    return new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }

  const publicUrl = buildPublicObjectUrl(bucket, filePath);
  if (publicUrl) {
    return Response.redirect(publicUrl, 302);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response("Supabase is not configured (missing SUPABASE_URL or a secret key)", {
      status: 500,
      headers: { "cache-control": "no-store" }
    });
  }

  const fromSdk = supabase.storage.from(bucket).getPublicUrl(filePath);
  const sdkUrl = (fromSdk?.data?.publicUrl || "").trim();
  if (sdkUrl) {
    return Response.redirect(sdkUrl, 302);
  }

  return Response.json(
    {
      error: "Object URL is not available",
      bucket,
      path: filePath
    },
    { status: 404, headers: { "cache-control": "no-store" } }
  );
}
