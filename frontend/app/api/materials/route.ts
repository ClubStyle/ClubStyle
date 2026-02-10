import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = "nodejs";

const dataPath = path.join(process.cwd(), 'data', 'materials.json');
const uiPath = path.join(process.cwd(), 'data', 'ui.json');

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
    const key = new URL(request.url).searchParams.get('key')?.trim() || 'materials';
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
              return NextResponse.json(data.value, { headers: withSource("supabase") });
            }
          } else {
            return NextResponse.json(data.value, { headers: withSource("supabase") });
          }
        }
      } catch {}
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
    return NextResponse.json(data, { headers: withSource("file") });
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
        const key = new URL(request.url).searchParams.get('key')?.trim() || 'materials';
        const body = await request.json();
        if (key === 'materials') {
          if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Data must be an array' }, { status: 400 });
          }
        }
        const isVercel = Boolean(process.env.VERCEL);
        const supabase = getSupabase();
        if (!supabase && isVercel) {
          return NextResponse.json(
            { error: 'Saving materials on Vercel requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' },
            { status: 501, headers: { 'cache-control': 'no-store' } }
          );
        }
        if (supabase) {
          const { error } = await supabase.client
            .from(supabase.table)
            .upsert({ key, value: body }, { onConflict: 'key' });
          if (error) {
            return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
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
