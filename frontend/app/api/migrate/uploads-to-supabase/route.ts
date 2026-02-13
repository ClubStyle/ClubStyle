import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

type SupabaseClientLite = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data?: { value?: unknown } | null; error?: { message?: string } | null }>;
      };
    };
    upsert: (
      values: { key: string; value: unknown },
      opts?: { onConflict?: string }
    ) => Promise<{ error?: { message?: string } | null }>;
  };
  storage: {
    listBuckets: () => Promise<{ data?: { name: string }[]; error?: { message: string } | null }>;
    createBucket: (name: string, opts: { public: boolean }) => Promise<{ error?: { message: string } | null }>;
    from: (bucket: string) => {
      upload: (
        key: string,
        bytes: Uint8Array | Buffer,
        opts: { contentType: string; upsert: boolean }
      ) => Promise<{ error?: { message: string } | null }>;
      getPublicUrl: (key: string) => { data?: { publicUrl?: string } };
      download: (key: string) => Promise<{ data?: unknown; error?: unknown }>;
    };
  };
};

type MaterialItem = {
  id: string;
  title: string;
  hashtag: string;
  image: string;
  images?: string[];
  link: string;
  video_link?: string;
  description?: string;
  type?: string;
  image_position?: string;
  date?: number;
};

function isAdminAuthorized(request: Request) {
  const user = request.headers.get("x-admin-user") || "";
  const pass = request.headers.get("x-admin-pass") || "";
  const expectedPass = (process.env.ADMIN_PASSWORD || "").trim();
  return Boolean(user.trim()) && expectedPass && pass.trim() === expectedPass;
}

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
  return createClient<Database, "public">(url, key) as unknown as SupabaseClientLite;
}

async function readKv(client: SupabaseClientLite, table: string, key: string): Promise<unknown | null> {
  const { data, error } = await client.from(table).select("key,value").eq("key", key).maybeSingle();
  if (error) return null;
  return data?.value ?? null;
}

async function writeKv(client: SupabaseClientLite, table: string, key: string, value: unknown) {
  const { error } = await client.from(table).upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(error.message || "Failed to write kv");
}

async function ensureBucket(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  bucket: string
): Promise<{ ok: true } | { ok: false; error: string; buckets?: string[] }> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    return { ok: false, error: listError.message };
  }
  const existing = (buckets || []).map((b) => b.name).filter(Boolean);
  if (existing.includes(bucket)) return { ok: true };
  const { error: createError } = await supabase.storage.createBucket(bucket, { public: true });
  if (createError) {
    return { ok: false, error: createError.message, buckets: existing };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers: { "cache-control": "no-store" } });
  }
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json(
      { error: "Supabase не настроен (SUPABASE_URL + секретный ключ)" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  const bucket = (process.env.SUPABASE_UPLOADS_BUCKET || "uploads").trim() || "uploads";
  const bucketReady = await ensureBucket(supabase, bucket);
  if (!bucketReady.ok) {
    const suffix =
      bucketReady.buckets && bucketReady.buckets.length
        ? ` Доступные buckets: ${bucketReady.buckets.join(", ")}`
        : "";
    return Response.json(
      { error: `Bucket "${bucket}" недоступен. ${bucketReady.error}.${suffix}` },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }

  const table = "app_kv";
  let materials: MaterialItem[] = [];
  try {
    const kv = await readKv(supabase, table, "materials");
    if (Array.isArray(kv)) {
      materials = kv as MaterialItem[];
    } else {
      const localPath = path.join(process.cwd(), "data", "materials.json");
      const raw = await fs.promises.readFile(localPath, "utf8");
      materials = JSON.parse(raw);
    }
  } catch {
    const localPath = path.join(process.cwd(), "data", "materials.json");
    const raw = await fs.promises.readFile(localPath, "utf8");
    materials = JSON.parse(raw);
  }

  let uploaded = 0;
  let updated = 0;
  const baseDir = path.join(process.cwd(), "public");

  const nextMaterials = await Promise.all(
    materials.map(async (m) => {
      const transform = async (p: string): Promise<string> => {
        if (!p || typeof p !== "string") return p;
        if (!p.startsWith("/uploads/")) return p;
        const base = path.basename(p); // e.g., 15356.jpg
        const key = `materials/${base}`;
        const filePath = path.join(baseDir, p);
        try {
          const stat = await fs.promises.stat(filePath);
          if (stat.isFile()) {
            const bytes = await fs.promises.readFile(filePath);
            const { error } = await supabase.storage.from(bucket).upload(key, bytes, {
              contentType: "image/jpeg",
              upsert: true
            });
            if (!error) {
              uploaded++;
            }
          }
        } catch {}
        updated++;
        return `/api/supabase-file?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(key)}`;
      };

      const image = typeof m.image === "string" ? await transform(m.image) : m.image;
      const images = Array.isArray(m.images) ? await Promise.all(m.images.map((p) => transform(p))) : m.images;
      return { ...m, image, images };
    })
  );

  try {
    await writeKv(supabase, table, "materials", nextMaterials);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e || "write failed");
    return Response.json({ error: message, uploaded, updated }, { status: 500, headers: { "cache-control": "no-store" } });
  }

  return Response.json(
    { ok: true, uploaded, updated, total: nextMaterials.length },
    { headers: { "cache-control": "no-store" } }
  );
}
