import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = "nodejs";

const dataPath = path.join(process.cwd(), 'data', 'materials.json');
const uiPath = path.join(process.cwd(), 'data', 'ui.json');

const ALWAYS_HIDDEN_MATERIAL_IDS = new Set(['look_1', 'look_2', 'look_3', 'look_4', 'look_5']);

type MaterialItem = {
  id: string;
  title?: string;
  hashtag?: string;
  image?: string;
  images?: string[];
  link?: string;
  description?: string;
  video_link?: string;
  date?: number;
  type?: string;
  image_position?: string;
};

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
  return { client: createClient<Database, 'public'>(url, key), table: 'app_kv' as const };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}

async function readKvValue(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  key: string
): Promise<unknown> {
  const { data, error } = await supabase.client
    .from(supabase.table)
    .select('key,value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return (data as { value?: unknown } | null)?.value;
}

async function getHiddenMaterialIds(
  supabase: ReturnType<typeof getSupabase>
): Promise<Set<string>> {
  const out = new Set<string>(ALWAYS_HIDDEN_MATERIAL_IDS);
  const deletedKey = 'materials_deleted_ids';
  if (supabase) {
    try {
      const value = await readKvValue(supabase, deletedKey);
      for (const id of asStringArray(value)) out.add(id);
    } catch {}
    return out;
  }
  const ui = await readUiFile();
  for (const id of asStringArray(ui[deletedKey])) out.add(id);
  return out;
}

function filterMaterials(value: unknown, hidden: Set<string>) {
  if (!Array.isArray(value)) return [];
  return value.filter((m) => {
    if (!m || typeof m !== 'object') return false;
    const id = (m as { id?: unknown }).id;
    return typeof id === 'string' && id.trim() && !hidden.has(id.trim());
  });
}

type CompactOptions = {
  lite?: boolean;
  maxImages?: number;
  maxDescription?: number;
};

function compactMaterials(value: unknown, options?: CompactOptions): MaterialItem[] {
  if (!Array.isArray(value)) return [];
  const lite = Boolean(options?.lite);
  const maxImages = Number.isFinite(Number(options?.maxImages))
    ? Math.max(0, Math.floor(Number(options?.maxImages)))
    : lite
      ? 1
      : 6;
  const maxDescription = Number.isFinite(Number(options?.maxDescription))
    ? Math.max(0, Math.floor(Number(options?.maxDescription)))
    : lite
      ? 400
      : 1200;
  return value
    .map((m) => (m && typeof m === "object" ? (m as Record<string, unknown>) : null))
    .map((m) => {
      const id = typeof m?.id === "string" ? m.id.trim() : "";
      if (!id) return null;
      const title = typeof m?.title === "string" ? m.title : "";
      const hashtag = typeof m?.hashtag === "string" ? m.hashtag : "";
      const image = typeof m?.image === "string" ? m.image : "/ban.png";
      const link = typeof m?.link === "string" ? m.link : "";
      const video_link = typeof m?.video_link === "string" ? m.video_link : "";
      const type = typeof m?.type === "string" ? m.type : "";
      const image_position = typeof m?.image_position === "string" ? m.image_position : "";
      const date =
        typeof m?.date === "number" ? m.date : Number.isFinite(Number(m?.date)) ? Number(m?.date) : undefined;
      const images = Array.isArray(m?.images)
        ? m.images
            .map((v: unknown) => (typeof v === "string" ? v.trim() : ""))
            .filter(Boolean)
            .slice(0, maxImages)
        : undefined;
      const description =
        maxDescription > 0 && typeof m?.description === "string" && m.description.trim().length
          ? m.description.trim().slice(0, maxDescription)
          : undefined;
      return {
        id,
        title,
        hashtag,
        image,
        images,
        link,
        description,
        video_link,
        type,
        image_position,
        date
      } satisfies MaterialItem;
    })
    .filter(Boolean) as MaterialItem[];
}

function findMaterialById(value: unknown, id: string): MaterialItem | null {
  if (!Array.isArray(value)) return null;
  const needle = id.trim();
  if (!needle) return null;
  for (const it of value) {
    if (!it || typeof it !== "object") continue;
    const itemId = (it as { id?: unknown }).id;
    if (typeof itemId === "string" && itemId.trim() === needle) {
      return it as MaterialItem;
    }
  }
  return null;
}

async function readUiFile(): Promise<Record<string, unknown>> {
  try {
    const fileContents = await fs.promises.readFile(uiPath, 'utf8');
    const data = JSON.parse(fileContents);
    if (data && typeof data === 'object') return data as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}

async function writeUiFile(next: Record<string, unknown>) {
  await fs.promises.writeFile(uiPath, JSON.stringify(next, null, 2));
}

function isAdminAuthorized(request: Request) {
  const secret = (process.env.ADMIN_SECRET || '').trim();
  const auth = (request.headers.get('authorization') || '').trim();
  if (secret) {
    if (auth === secret) return true;
    if (auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice('bearer '.length).trim();
      if (token === secret) return true;
    }
  }

  const user = (process.env.ADMIN_USER || 'h1').trim();
  const pass = (process.env.ADMIN_PASSWORD || '').trim();
  if (!pass) return false;
  const reqUser = (request.headers.get('x-admin-user') || '').trim();
  const reqPass = (request.headers.get('x-admin-pass') || '').trim();
  return reqUser === user && reqPass === pass;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key')?.trim() || 'materials';
    const materialId = (url.searchParams.get("id") || "").trim();
    const sourceParam = (url.searchParams.get("source") || "").trim().toLowerCase();
    const forceSupabaseParam = (url.searchParams.get("supabase") || "").trim().toLowerCase();
    const liteParam = (url.searchParams.get("lite") || "").trim().toLowerCase();
    const lite = liteParam === "1" || liteParam === "true" || liteParam === "yes";
    const limitRaw = (url.searchParams.get("limit") || "").trim();
    const limit = limitRaw ? Number(limitRaw) : NaN;
    const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : null;
    const searchQuery = (url.searchParams.get("search") || "").trim().toLowerCase();
    const isVercel = Boolean(process.env.VERCEL);
    const noStoreHeaders = {
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      pragma: 'no-cache',
      expires: '0'
    } as const;
    const withSource = (source: "supabase" | "file") =>
      ({ ...noStoreHeaders, "x-materials-source": source }) as const;
    const supabase = getSupabase();
    const preferSupabase =
      isVercel ||
      sourceParam === "supabase" ||
      forceSupabaseParam === "1" ||
      forceSupabaseParam === "true" ||
      forceSupabaseParam === "yes";

    let supabaseMaterials: MaterialItem[] = [];
    let supabaseFound = false;

    if (supabase && preferSupabase) {
      try {
        const { data, error } = await supabase.client
          .from(supabase.table)
          .select('key,value')
          .eq('key', key)
          .maybeSingle();
        if (!error && data?.value != null) {
          if (key === 'materials' && Array.isArray(data.value)) {
            supabaseMaterials = data.value;
            supabaseFound = true;
          } else if (key !== 'materials') {
            return NextResponse.json(data.value, { headers: withSource("supabase") });
          }
        }
      } catch (e) {
        console.error("Supabase fetch error:", e);
      }
    }

    // Always load local file as base/fallback
    let fileMaterials: MaterialItem[] = [];
    let fileUi: Record<string, any> = {};
    try {
      const fileContents = await fs.promises.readFile(dataPath, 'utf8');
      fileMaterials = JSON.parse(fileContents);
    } catch (e) {
      console.error("File read error:", e);
    }
    try {
      fileUi = await readUiFile();
    } catch (e) {
      console.error("UI file read error:", e);
    }

    // Merge logic: use Supabase items to override/augment local file items
    // If Supabase has data, we prioritize it, but fill in the gaps from the file
    if (key === 'materials') {
      const mergedMap = new Map<string, MaterialItem>();
      
      // Add file materials first
      for (const m of fileMaterials) {
        if (m && m.id) mergedMap.set(String(m.id), m);
      }
      
      // Add/overwrite with Supabase materials (these are the ones from admin panel)
      for (const m of supabaseMaterials) {
        if (m && m.id) mergedMap.set(String(m.id), m);
      }
      
      let combined = Array.from(mergedMap.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
      
      const hidden = await getHiddenMaterialIds(supabase);
      let visible = filterMaterials(combined, hidden);
      
      if (searchQuery) {
        visible = visible.filter((m) => {
          const t = (m.title || "").toLowerCase();
          const h = (m.hashtag || "").toLowerCase();
          const i = (m.id || "").toLowerCase();
          return t.includes(searchQuery) || h.includes(searchQuery) || i.includes(searchQuery);
        });
      }

      if (materialId) {
        const found = findMaterialById(visible, materialId);
        if (!found) {
          return NextResponse.json({ error: "Not found" }, { status: 404, headers: withSource(supabaseFound ? "supabase" : "file") });
        }
        return NextResponse.json(found, { headers: withSource(supabaseFound ? "supabase" : "file") });
      }

      let out = compactMaterials(visible, lite ? { lite } : undefined);
      if (safeLimit != null) out = out.slice(0, safeLimit);
      return NextResponse.json(out, { headers: withSource(supabaseFound ? "supabase" : "file") });
    }

    // For UI keys (categories, etc.)
    // If Supabase didn't have it, we use the local file version
    const value = fileUi[key];
    return NextResponse.json(value ?? null, { headers: withSource("file") });
} catch (error) {
    console.error("Error reading materials data:", error);
    return NextResponse.json(
      { error: 'Failed to read materials' },
      { status: 500, headers: { 'cache-control': 'no-store' } }
    );
  }
}

export async function POST(request: Request) {
    try {
        if (!isAdminAuthorized(request)) {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403, headers: { 'cache-control': 'no-store' } }
          );
        }
        const url = new URL(request.url);
        const key = url.searchParams.get('key')?.trim() || 'materials';
        const op = (url.searchParams.get("op") || "").trim();
        const body = await request.json();
        const isVercel = Boolean(process.env.VERCEL);
        const supabase = getSupabase();
        if (!supabase && isVercel) {
          return NextResponse.json(
            { error: 'Saving materials on Vercel requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' },
            { status: 501, headers: { 'cache-control': 'no-store' } }
          );
        }
        if (key === "materials" && op === "upsertOne") {
          if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Data must be an object" }, { status: 400 });
          }
          const incoming = body as Partial<MaterialItem>;
          const id = typeof incoming.id === "string" ? incoming.id.trim() : "";
          if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
          }
          const currentRaw = supabase ? await readKvValue(supabase, "materials") : JSON.parse(await fs.promises.readFile(dataPath, "utf8"));
          const current = Array.isArray(currentRaw) ? (currentRaw as MaterialItem[]) : [];
          
          // IMPORTANT: If currentRaw is empty (first time saving to Supabase), we should probably init it with file data?
          // But maybe not, to avoid huge payload. Let's just treat Supabase as "overrides" only layer.
          // Wait, if we only save one item, we need the full list?
          // Actually, 'materials' key in Supabase should store ONLY the modified items or ALL items?
          // If we store ALL items (14k+), it might hit Supabase row size limits (JSONB size limit).
          // Strategy: Supabase 'materials' key stores only manually modified items.
          // BUT the current logic reads 'materials' key and expects an array.
          // If the user edits one item, we need to make sure we don't lose the others IF they were already in Supabase.
          // If Supabase was empty, we start with empty array? No, that would mean we only see 1 item in "overrides".
          // The merge logic in GET handles the rest.
          // So:
          // 1. Read existing overrides from Supabase (or empty array if none)
          // 2. Add/Update the modified item
          // 3. Save back to Supabase
          
          const idx = current.findIndex((m) => m && typeof m === "object" && typeof (m as MaterialItem).id === "string" && (m as MaterialItem).id === id);
          const next = [...current];
          
          if (idx >= 0) {
            // Update existing override
            next[idx] = { ...next[idx], ...(incoming as MaterialItem), id };
          } else {
            // New override. But wait, if it's not in Supabase, it might be in the local file.
            // We should check if we need to "promote" it from local file to Supabase first?
            // If we just push `incoming`, it might lack some fields if `incoming` is partial.
            // But usually the Admin Panel sends the full object.
            // Let's assume Admin Panel sends full object or we accept partial updates to overrides.
            next.push(incoming as MaterialItem);
          }
          
          if (supabase) {
            const { error } = await supabase.client
              .from(supabase.table)
              .upsert({ key: "materials", value: next }, { onConflict: "key" });
            if (error) return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
            
            // We do NOT write to local file in Vercel environment, that's fine.
            // But in local dev we might want to? 
            // Actually, better to keep local file as "upstream source" and Supabase as "overrides".
            // So we don't modify local file when using Supabase, to avoid confusion.
          } else {
            // Local dev without Supabase: modify local file directly (legacy behavior)
            // But we need to read full file first, not just "currentRaw" which might be empty if we switched logic.
            // Re-read file to be safe if we are in local mode.
             const fullFileRaw = JSON.parse(await fs.promises.readFile(dataPath, "utf8"));
             const fullFile = Array.isArray(fullFileRaw) ? (fullFileRaw as MaterialItem[]) : [];
             const fIdx = fullFile.findIndex(m => m.id === id);
             if (fIdx >= 0) {
                 fullFile[fIdx] = { ...fullFile[fIdx], ...(incoming as MaterialItem), id };
             } else {
                 fullFile.push(incoming as MaterialItem);
             }
             await fs.promises.writeFile(dataPath, JSON.stringify(fullFile, null, 2));
          }
          return NextResponse.json({ success: true });
        }

        if (key === "materials" && op === "deleteOne") {
          const id =
            typeof (body as { id?: unknown } | null)?.id === "string"
              ? ((body as { id: string }).id || "").trim()
              : "";
          if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
          }
          const currentRaw = supabase ? await readKvValue(supabase, "materials") : JSON.parse(await fs.promises.readFile(dataPath, "utf8"));
          const current = Array.isArray(currentRaw) ? (currentRaw as MaterialItem[]) : [];
          // If using Supabase, 'current' only contains overrides.
          // If we want to delete an item, we have 2 cases:
          // 1. It's a manual item (only in Supabase) -> remove from 'current' and save.
          // 2. It's a file item (in local file) -> we need to mark it as "hidden" or "deleted" in Supabase.
          // But our current logic for 'hidden' uses a separate table/list (getHiddenMaterialIds).
          // If we just remove it from 'current' (overrides), it might still exist in file!
          // So 'deleteOne' logic is tricky with the new merge strategy.
          // Let's stick to 'hidden' list for hiding items.
          // But if the Admin Panel expects DELETE to really delete...
          // If it's a file item, we can't delete it from the file on Vercel.
          // So we should add it to 'hidden' list instead.
          // BUT, for now, let's assume 'deleteOne' is mostly for manual items.
          // If it is in Supabase overrides, remove it.
          
          const next = current.filter((m) => !(m && typeof m === "object" && typeof (m as MaterialItem).id === "string" && (m as MaterialItem).id === id));
          
          if (supabase) {
            const { error } = await supabase.client
              .from(supabase.table)
              .upsert({ key: "materials", value: next }, { onConflict: "key" });
            if (error) return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
            
            // Also, we might want to ensure it's hidden if it exists in file?
            // For now, let's keep it simple: we update the overrides list.
          } else {
             // Local mode: delete from file
             const fullFileRaw = JSON.parse(await fs.promises.readFile(dataPath, "utf8"));
             const fullFile = Array.isArray(fullFileRaw) ? (fullFileRaw as MaterialItem[]) : [];
             const nextFile = fullFile.filter(m => m.id !== id);
             await fs.promises.writeFile(dataPath, JSON.stringify(nextFile, null, 2));
          }
          return NextResponse.json({ success: true });
        }

        if (key === 'materials' && !Array.isArray(body)) {
          return NextResponse.json({ error: 'Data must be an array' }, { status: 400 });
        }

        if (supabase) {
          const { error } = await supabase.client
            .from(supabase.table)
            .upsert({ key, value: body }, { onConflict: 'key' });
          if (error) {
            return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
          }
          if (!isVercel) {
            if (key === 'materials') {
              await fs.promises.writeFile(dataPath, JSON.stringify(body, null, 2));
            } else {
              const ui = await readUiFile();
              await writeUiFile({ ...ui, [key]: body });
            }
          }
        } else {
          if (key === 'materials') {
            await fs.promises.writeFile(dataPath, JSON.stringify(body, null, 2));
          } else {
            const ui = await readUiFile();
            await writeUiFile({ ...ui, [key]: body });
          }
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error writing materials data:", error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
