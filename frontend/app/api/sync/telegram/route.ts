import { createClient } from "@supabase/supabase-js";
import TelegramBot from "node-telegram-bot-api";

type MaterialItem = {
  id: string;
  title: string;
  hashtag: string;
  image: string;
  images?: string[];
  link: string;
  description?: string;
  video_link?: string;
  date?: number;
};

type KvRow = {
  key: string;
  value: unknown;
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

function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = (process.env.TELEGRAM_TARGET_CHAT_ID || "").trim();
  const chatId = rawChatId ? Number(rawChatId) : -1002055411531;
  const rawDays = (process.env.TELEGRAM_DAYS_WINDOW || "").trim();
  const daysWindow = rawDays ? Number(rawDays) : 10;
  return {
    token,
    chatId: Number.isFinite(chatId) && chatId !== 0 ? chatId : -1002055411531,
    daysWindow: Number.isFinite(daysWindow) && daysWindow > 0 ? daysWindow : 10
  };
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { client: createClient<Database, "public">(url, key), table: "app_kv" as const };
}

async function readKv(
  client: ReturnType<typeof createClient<Database, "public">>,
  table: "app_kv",
  key: string
) {
  const { data, error } = await client
    .from(table)
    .select("key,value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data as KvRow | null)?.value;
}

async function writeKv(
  client: ReturnType<typeof createClient<Database, "public">>,
  table: "app_kv",
  key: string,
  value: unknown
) {
  const { error } = await client
    .from(table)
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
}

function asArray(value: unknown): MaterialItem[] {
  return Array.isArray(value) ? (value as MaterialItem[]) : [];
}

function makeImageUrl(fileId: string) {
  return `/api/telegram-file?fileId=${encodeURIComponent(fileId)}`;
}

export async function GET(request: Request) {
  const isCron = request.headers.get("x-vercel-cron") === "1";
  if (!isCron) {
    return new Response("Forbidden", { status: 403 });
  }
  return syncTelegram();
}

export async function POST() {
  return syncTelegram();
}

async function syncTelegram() {
  const { token, chatId, daysWindow } = getTelegramConfig();
  if (!token) {
    return Response.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return Response.json(
      { error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required for Vercel sync" },
      { status: 500 }
    );
  }

  const bot = new TelegramBot(token, { polling: false });
  const cutoffTs = Math.floor(Date.now() / 1000) - daysWindow * 24 * 60 * 60;

  const lastUpdateRaw = await readKv(supabase.client, supabase.table, "telegram_last_update_id");
  const lastUpdateId = typeof lastUpdateRaw === "number" ? lastUpdateRaw : Number(lastUpdateRaw || 0);
  const offsetStart = Number.isFinite(lastUpdateId) && lastUpdateId > 0 ? lastUpdateId + 1 : undefined;

  const updates: TelegramBot.Update[] = [];
  let offset = offsetStart;
  while (true) {
    const batch = (await bot.getUpdates({
      offset,
      limit: 100,
      allowed_updates: ["channel_post", "message"]
    })) as TelegramBot.Update[];
    if (!batch.length) break;
    updates.push(...batch);
    offset = batch[batch.length - 1]!.update_id + 1;
    if (batch.length < 100) break;
  }

  const maxUpdateId = updates.reduce((m, u) => Math.max(m, Number(u.update_id) || 0), lastUpdateId || 0);

  const existing = asArray(await readKv(supabase.client, supabase.table, "materials"));
  const byId = new Map<string, MaterialItem>();
  for (const item of existing) byId.set(item.id, item);

  const groups = new Map<string, { ids: number[]; chatId: number; date: number; text: string; photoFileIds: string[] }>();

  for (const update of updates) {
    const msg = update.channel_post || update.message;
    if (!msg) continue;
    if (!msg.chat || msg.chat.id !== chatId) continue;
    if (!msg.date || msg.date < cutoffTs) continue;

    const key = msg.media_group_id ? `group:${msg.media_group_id}` : `single:${msg.message_id}`;
    if (!groups.has(key)) {
      groups.set(key, { ids: [], chatId: msg.chat.id, date: msg.date, text: "", photoFileIds: [] });
    }

    const g = groups.get(key)!;
    g.ids.push(msg.message_id);
    g.date = Math.max(g.date, msg.date);
    const text = msg.caption || msg.text || "";
    if (text && text.length > (g.text?.length || 0)) g.text = text;

    if (msg.photo?.length) {
      const photo = msg.photo[msg.photo.length - 1];
      if (photo?.file_id) g.photoFileIds.push(String(photo.file_id));
    }
  }

  let added = 0;
  for (const g of groups.values()) {
    const minId = g.ids.length ? Math.min(...g.ids) : undefined;
    if (!minId) continue;
    const id = String(minId);
    if (byId.has(id)) continue;

    const title = g.text.split("\n")[0].substring(0, 100) || "Новый пост";
    const hashtags = (g.text.match(/#[a-zа-я0-9_]+/gi) || []).join(" ");
    const publicChatId = g.chatId.toString().replace("-100", "");
    const link = `https://t.me/c/${publicChatId}/${id}`;
    const images = g.photoFileIds.map(makeImageUrl);
    const image = images.length ? images[0] : "/ban.png";

    const item: MaterialItem = {
      id,
      title,
      hashtag: hashtags || "#новинка",
      image,
      images,
      link,
      description: g.text,
      date: g.date
    };

    byId.set(id, item);
    added++;
  }

  const combined = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
  await writeKv(supabase.client, supabase.table, "materials", combined);
  await writeKv(supabase.client, supabase.table, "telegram_last_update_id", maxUpdateId);

  return Response.json(
    { ok: true, added, total: combined.length, updates: updates.length, maxUpdateId },
    { headers: { "cache-control": "no-store" } }
  );
}
