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

function inferImageContentType(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bucket = (url.searchParams.get("bucket") || "").trim();
  const filePath = (url.searchParams.get("path") || "").trim();

  if (!bucket || bucket.length > 128) {
    return new Response("Bad Request", { status: 400 });
  }
  if (!filePath || filePath.length > 1024) {
    return new Response("Bad Request", { status: 400 });
  }

  const expectedBucket = (process.env.SUPABASE_UPLOADS_BUCKET || "uploads").trim() || "uploads";
  if (bucket !== expectedBucket) {
    return new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }
  if (!filePath.startsWith("materials/")) {
    return new Response("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  }

  const supabase = getSupabase();
  if (!supabase) {
    const publicUrl = buildPublicObjectUrl(bucket, filePath);
    if (publicUrl) {
      return Response.redirect(publicUrl, 302);
    }
    return new Response("Supabase is not configured", {
      status: 500,
      headers: { "cache-control": "no-store" }
    });
  }

  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !data) {
    const publicUrl = buildPublicObjectUrl(bucket, filePath);
    if (publicUrl) {
      return Response.redirect(publicUrl, 302);
    }
    return new Response("Not Found", { status: 404, headers: { "cache-control": "no-store" } });
  }

  const body = Buffer.from(await data.arrayBuffer());
  const headers = new Headers();
  const inferred = inferImageContentType(filePath);
  const contentType = inferred || (data.type && data.type.startsWith("image/") ? data.type : null);
  if (contentType) headers.set("content-type", contentType);
  headers.set("cache-control", "public, max-age=3600");

  return new Response(body, { status: 200, headers });
}
