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

function compactMaterials(value: unknown): MaterialItem[] {
  if (!Array.isArray(value)) return [];
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
            .slice(0, 6)
        : undefined;
      const description =
        typeof m?.description === "string" && m.description.trim().length
          ? m.description.trim().slice(0, 1200)
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
    const isVercel = Boolean(process.env.VERCEL);
    const noStoreHeaders = {
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      pragma: 'no-cache',
      expires: '0'
    } as const;
    const withSource = (source: "supabase" | "file") =>
      ({ ...noStoreHeaders, "x-materials-source": source }) as const;
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.client
          .from(supabase.table)
          .select('key,value')
          .eq('key', key)
          .maybeSingle();
        if (!error && data?.value != null) {
          if (key === 'materials') {
            if (Array.isArray(data.value)) {
              const hidden = await getHiddenMaterialIds(supabase);
              const visible = filterMaterials(data.value, hidden);
              if (materialId) {
                const found = findMaterialById(visible, materialId);
                if (!found) {
                  return NextResponse.json({ error: "Not found" }, { status: 404, headers: withSource("supabase") });
                }
                return NextResponse.json(found, { headers: withSource("supabase") });
              }
              return NextResponse.json(compactMaterials(visible), { headers: withSource("supabase") });
            }
          } else {
            return NextResponse.json(data.value, { headers: withSource("supabase") });
          }
        }
      } catch {}
    }
    if (supabase && isVercel) {
      if (key === 'materials') {
        if (materialId) {
          return NextResponse.json({ error: "Not found" }, { status: 404, headers: withSource("supabase") });
        }
        return NextResponse.json([], { headers: withSource("supabase") });
      }
      return NextResponse.json(null, { headers: withSource("supabase") });
    }

    if (key !== 'materials') {
      const ui = await readUiFile();
      const value = ui[key];
      if (value == null) {
        return NextResponse.json(null, { headers: withSource("file") });
      }
      return NextResponse.json(value, { headers: withSource("file") });
    }

    const fileContents = await fs.promises.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    const hidden = await getHiddenMaterialIds(supabase);
    const visible = filterMaterials(data, hidden);
    if (materialId) {
      const found = findMaterialById(visible, materialId);
      if (!found) {
        return NextResponse.json({ error: "Not found" }, { status: 404, headers: withSource("file") });
      }
      return NextResponse.json(found, { headers: withSource("file") });
    }
    return NextResponse.json(compactMaterials(visible), { headers: withSource("file") });
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
          const idx = current.findIndex((m) => m && typeof m === "object" && typeof (m as MaterialItem).id === "string" && (m as MaterialItem).id === id);
          const next = idx >= 0 ? [...current] : [incoming as MaterialItem, ...current];
          if (idx >= 0) {
            next[idx] = { ...(current[idx] as MaterialItem), ...(incoming as MaterialItem), id };
          }
          if (supabase) {
            const { error } = await supabase.client
              .from(supabase.table)
              .upsert({ key: "materials", value: next }, { onConflict: "key" });
            if (error) return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
            if (!isVercel) {
              await fs.promises.writeFile(dataPath, JSON.stringify(next, null, 2));
            }
          } else {
            await fs.promises.writeFile(dataPath, JSON.stringify(next, null, 2));
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
          const next = current.filter((m) => !(m && typeof m === "object" && typeof (m as MaterialItem).id === "string" && (m as MaterialItem).id === id));
          if (supabase) {
            const { error } = await supabase.client
              .from(supabase.table)
              .upsert({ key: "materials", value: next }, { onConflict: "key" });
            if (error) return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
            if (!isVercel) {
              await fs.promises.writeFile(dataPath, JSON.stringify(next, null, 2));
            }
          } else {
            await fs.promises.writeFile(dataPath, JSON.stringify(next, null, 2));
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
