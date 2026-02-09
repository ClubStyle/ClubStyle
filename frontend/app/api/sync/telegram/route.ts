import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import TelegramBot from "node-telegram-bot-api";

export const runtime = "nodejs";

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
  const defaultDaysWindow = 365;
  const rawDays = (process.env.TELEGRAM_DAYS_WINDOW || "").trim();
  const daysWindow = rawDays ? Number(rawDays) : defaultDaysWindow;
  return {
    token,
    chatId: Number.isFinite(chatId) && chatId !== 0 ? chatId : -1002055411531,
    daysWindow:
      Number.isFinite(daysWindow) && daysWindow > 0 ? daysWindow : defaultDaysWindow
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

type TextEntity = { type?: string; offset?: number; length?: number; url?: string };

function uniqStrings(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const v = (it || "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function normalizeUrl(raw: string) {
  const v = (raw || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(t\.me|telegram\.me)\//i.test(v)) return `https://${v}`;
  if (/^www\./i.test(v)) return `https://${v}`;
  return v;
}

function extractUrls(text: string, entities: TextEntity[] | undefined) {
  const urls: string[] = [];
  if (Array.isArray(entities)) {
    for (const ent of entities) {
      if (!ent || typeof ent !== "object") continue;
      const type = typeof ent.type === "string" ? ent.type : "";
      if (type === "text_link" && typeof ent.url === "string") {
        urls.push(normalizeUrl(ent.url));
        continue;
      }
      if (type === "url") {
        const offset = typeof ent.offset === "number" ? ent.offset : -1;
        const length = typeof ent.length === "number" ? ent.length : -1;
        if (offset >= 0 && length > 0) {
          const raw = text.slice(offset, offset + length);
          urls.push(normalizeUrl(raw));
        }
      }
    }
  }

  const rxHttp = /https?:\/\/[^\s<>"'()]+/gi;
  for (const m of text.match(rxHttp) || []) urls.push(normalizeUrl(m));

  const rxWww = /www\.[^\s<>"'()]+/gi;
  for (const m of text.match(rxWww) || []) urls.push(normalizeUrl(m));

  const rxTme = /\bt\.me\/[^\s<>"'()]+/gi;
  for (const m of text.match(rxTme) || []) urls.push(normalizeUrl(m));

  return uniqStrings(urls).filter((u) => u.length <= 2048);
}

function appendMissingLinks(description: string, links: string[]) {
  const base = (description || "").trimEnd();
  const missing = links.filter((u) => u && !base.includes(u));
  if (!missing.length) return base;
  const suffix = `\n\nСсылки:\n${missing.join("\n")}`;
  return `${base}${suffix}`;
}

function isAuthorized(request: Request) {
  const secret = (process.env.SYNC_TELEGRAM_SECRET || "").trim();
  if (!secret) return false;
  const auth = (request.headers.get("authorization") || "").trim();
  if (!auth) return false;
  if (auth === secret) return true;
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice("bearer ".length).trim();
    return token === secret;
  }
  return false;
}

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
  const isCron = request.headers.get("x-vercel-cron") === "1";
  if (!isCron) {
    return new Response("Forbidden", { status: 403 });
  }
  return syncTelegram(request);
}

export async function POST(request: Request) {
  const isCron = request.headers.get("x-vercel-cron") === "1";
  if (!isCron && !isAuthorized(request) && !isAdminAuthorized(request)) {
    return new Response("Forbidden", { status: 403 });
  }
  return syncTelegram(request);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-admin-user,x-admin-pass"
    }
  });
}

function asPositiveInt(value: string | null | undefined) {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

async function readSeedFromLocalFile(seedCount: number): Promise<MaterialItem[]> {
  if (!seedCount) return [];
  const filePath = path.join(process.cwd(), "data", "materials.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  const rows = parsed as MaterialItem[];
  const fromChannel = rows.filter((m) => {
    const idOk = typeof m.id === "string" && /^\d+$/.test(m.id);
    const linkOk = typeof m.link === "string" && m.link.includes("t.me/c/");
    return idOk && linkOk;
  });

  const sorted = fromChannel.sort((a, b) => (b.date || 0) - (a.date || 0));
  return sorted.slice(0, seedCount).map((m) => {
    const images = Array.isArray(m.images) ? m.images : [];
    const safeImages = images.filter((img) => typeof img === "string" && !img.startsWith("/uploads/"));
    const image =
      typeof m.image === "string" && !m.image.startsWith("/uploads/") ? m.image : "/ban.png";
    return {
      id: String(m.id),
      title: typeof m.title === "string" ? m.title : "Пост",
      hashtag: typeof m.hashtag === "string" ? m.hashtag : "#пост",
      image,
      images: safeImages,
      link: typeof m.link === "string" ? m.link : "https://t.me/c/2055411531/1",
      description: typeof m.description === "string" ? m.description : "",
      video_link: typeof m.video_link === "string" ? m.video_link : undefined,
      date: typeof m.date === "number" ? m.date : undefined
    };
  });
}

async function syncTelegram(request?: Request) {
  const url = request ? new URL(request.url) : null;
  const seedCount = asPositiveInt(url?.searchParams.get("seed"));
  const seedOnly = url?.searchParams.get("seedOnly") === "1";
  const { token, chatId, daysWindow } = getTelegramConfig();

  const supabase = getSupabase();
  if (!supabase) {
    if (seedCount) {
      const seedItems = await readSeedFromLocalFile(seedCount);
      return Response.json(
        {
          ok: true,
          added: 0,
          seeded: seedItems.length,
          seedTarget: seedCount || 0,
          total: seedItems.length,
          updates: 0,
          maxUpdateId: 0,
          seedOnly: Boolean(seedOnly),
          materials: seedItems
        },
        {
          headers: {
            "cache-control": "no-store",
            "access-control-allow-origin": "*"
          }
        }
      );
    }
    return Response.json(
      { error: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required for Vercel sync" },
      { status: 500, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  }

  const lastUpdateRaw = await readKv(supabase.client, supabase.table, "telegram_last_update_id");
  const lastUpdateId = typeof lastUpdateRaw === "number" ? lastUpdateRaw : Number(lastUpdateRaw || 0);
  const byId = new Map<string, MaterialItem>();
  for (const item of asArray(await readKv(supabase.client, supabase.table, "materials"))) {
    byId.set(item.id, item);
  }

  let updatesCount = 0;
  let added = 0;
  let maxUpdateId = lastUpdateId || 0;

  if (!seedOnly) {
    if (!token) {
      if (!seedCount) {
        return Response.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
      }
    } else {
      const bot = new TelegramBot(token, { polling: false });
      const cutoffTs = Math.floor(Date.now() / 1000) - daysWindow * 24 * 60 * 60;
      const offsetStart =
        Number.isFinite(lastUpdateId) && lastUpdateId > 0 ? lastUpdateId + 1 : undefined;

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

      updatesCount = updates.length;
      maxUpdateId = updates.reduce(
        (m, u) => Math.max(m, Number(u.update_id) || 0),
        lastUpdateId || 0
      );

      const groups = new Map<
        string,
        {
          ids: number[];
          chatId: number;
          date: number;
          text: string;
          entities?: TextEntity[];
          photoFileIds: string[];
        }
      >();

      for (const update of updates) {
        const msg = update.channel_post || update.message;
        if (!msg) continue;
        if (!msg.chat || msg.chat.id !== chatId) continue;
        if (!msg.date || msg.date < cutoffTs) continue;

        const key = msg.media_group_id
          ? `group:${msg.media_group_id}`
          : `single:${msg.message_id}`;
        if (!groups.has(key)) {
          groups.set(key, {
            ids: [],
            chatId: msg.chat.id,
            date: msg.date,
            text: "",
            entities: [],
            photoFileIds: []
          });
        }

        const g = groups.get(key)!;
        g.ids.push(msg.message_id);
        g.date = Math.max(g.date, msg.date);
        const text = msg.caption || msg.text || "";
        if (text && text.length > (g.text?.length || 0)) {
          g.text = text;
          const ents = (msg.caption_entities || msg.entities || []) as unknown;
          g.entities = Array.isArray(ents) ? (ents as TextEntity[]) : [];
        }

        if (msg.photo?.length) {
          const photo = msg.photo[msg.photo.length - 1];
          if (photo?.file_id) g.photoFileIds.push(String(photo.file_id));
        } else if (
          msg.document?.file_id &&
          typeof msg.document.mime_type === "string" &&
          msg.document.mime_type.startsWith("image/")
        ) {
          g.photoFileIds.push(String(msg.document.file_id));
        }
      }

      for (const g of groups.values()) {
        const minId = g.ids.length ? Math.min(...g.ids) : undefined;
        if (!minId) continue;
        const id = String(minId);
        const existingItem = byId.get(id);

        const title = g.text.split("\n")[0].substring(0, 100) || "Новый пост";
        const hashtags = (g.text.match(/#[a-zа-я0-9_]+/gi) || []).join(" ");
        const publicChatId = g.chatId.toString().replace("-100", "");
        const link = `https://t.me/c/${publicChatId}/${id}`;
        const images = g.photoFileIds.map(makeImageUrl);
        const image = images.length ? images[0] : "/ban.png";
        const extractedLinks = extractUrls(g.text, g.entities);
        const descriptionFromTg = appendMissingLinks(g.text, extractedLinks);

        const shouldUpdateImages =
          !existingItem ||
          existingItem.image === "/ban.png" ||
          !Array.isArray(existingItem.images) ||
          existingItem.images.length === 0;

        const currentTitle =
          existingItem && typeof existingItem.title === "string" ? existingItem.title.trim() : "";
        const currentHashtag =
          existingItem && typeof existingItem.hashtag === "string" ? existingItem.hashtag.trim() : "";
        const currentDescription =
          existingItem && typeof existingItem.description === "string"
            ? existingItem.description
            : "";

        const next: MaterialItem = {
          ...(existingItem || { id }),
          id,
          title: currentTitle && currentTitle !== "Новый пост" ? currentTitle : title,
          hashtag: currentHashtag && currentHashtag !== "#новинка" ? currentHashtag : hashtags || "#новинка",
          image: existingItem?.image || image,
          images: Array.isArray(existingItem?.images) ? existingItem?.images : images,
          link,
          description: appendMissingLinks(currentDescription.trim().length ? currentDescription : descriptionFromTg, extractedLinks),
          date: Math.max(existingItem?.date || 0, g.date || 0) || g.date
        };

        if (shouldUpdateImages) {
          next.image = image;
          next.images = images;
        }

        byId.set(id, next);
        if (!existingItem) added++;
      }
    }
  }

  let seeded = 0;
  if (seedCount) {
    const current = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
    if (current.length < seedCount) {
      const seedItems = await readSeedFromLocalFile(seedCount);
      for (const it of seedItems) {
        if (!byId.has(it.id)) {
          byId.set(it.id, it);
          seeded++;
          if (byId.size >= seedCount) break;
        }
      }
    }
  }

  const combined = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
  await writeKv(supabase.client, supabase.table, "materials", combined);
  await writeKv(supabase.client, supabase.table, "telegram_last_update_id", maxUpdateId);

  return Response.json(
    {
      ok: true,
      added,
      seeded,
      seedTarget: seedCount || 0,
      total: combined.length,
      updates: updatesCount,
      maxUpdateId
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
  );
}
