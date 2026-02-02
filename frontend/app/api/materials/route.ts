import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const dataPath = path.join(process.cwd(), 'data', 'materials.json');

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
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { client: createClient<Database, 'public'>(url, key), table: 'app_kv' as const };
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.client
        .from(supabase.table)
        .select('key,value')
        .eq('key', 'materials')
        .maybeSingle();
      if (!error && data?.value && Array.isArray(data.value)) {
        return NextResponse.json(data.value, { headers: { 'cache-control': 'no-store' } });
      }
    }

    const fileContents = await fs.promises.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
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
        const body = await request.json();
        // Validate basic structure if needed
        if (!Array.isArray(body)) {
             return NextResponse.json({ error: 'Data must be an array' }, { status: 400 });
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
            .upsert({ key: 'materials', value: body }, { onConflict: 'key' });
          if (error) {
            return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
          }
        } else {
          await fs.promises.writeFile(dataPath, JSON.stringify(body, null, 2));
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error writing materials data:", error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
