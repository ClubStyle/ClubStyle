import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import TelegramBot from "node-telegram-bot-api";

export const runtime = "nodejs";

const localMaterialsPath = path.join(process.cwd(), "data", "materials.json");
const localUiPath = path.join(process.cwd(), "data", "ui.json");

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

function getTelegramMaxUpdatesPerSync() {
  const raw = (process.env.TELEGRAM_MAX_UPDATES_PER_SYNC || "").trim();
  const n = raw ? Number(raw) : 200;
  const out = Number.isFinite(n) ? Math.floor(n) : 200;
  return out > 0 ? out : 200;
}

function getTelegramSecret() {
  const secret = (process.env.SYNC_TELEGRAM_SECRET || "").trim();
  if (secret) return secret;
  return (process.env.SYNC_TELEGRAM_SECRE || "").trim();
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

async function safeReadKv(
  client: ReturnType<typeof createClient<Database, "public">>,
  table: "app_kv",
  key: string
) {
  try {
    return await readKv(client, table, key);
  } catch {
    return null;
  }
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

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return parsed as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
}

async function readLocalUi() {
  const data = await readJsonFile<Record<string, unknown>>(localUiPath, {});
  return data && typeof data === "object" ? data : {};
}

async function readLocalKey(key: string) {
  const ui = await readLocalUi();
  return ui[key];
}

async function writeLocalKey(key: string, value: unknown) {
  const ui = await readLocalUi();
  await writeJsonFile(localUiPath, { ...ui, [key]: value });
}

async function readLocalMaterials() {
  const parsed = await readJsonFile<unknown>(localMaterialsPath, []);
  return Array.isArray(parsed) ? (parsed as MaterialItem[]) : [];
}

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
  const secret = getTelegramSecret();
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
  const telegramSecret = getTelegramSecret();
  const webhookSecret = (request.headers.get("x-telegram-bot-api-secret-token") || "").trim();
  if (telegramSecret && webhookSecret && webhookSecret === telegramSecret) {
    return handleTelegramWebhook(request);
  }
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
      "access-control-allow-headers":
        "content-type,authorization,x-admin-user,x-admin-pass,x-telegram-bot-api-secret-token"
    }
  });
}

function asPositiveInt(value: string | null | undefined) {
  const n = value ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function describeTelegramError(e: unknown) {
  if (e && typeof e === "object") {
    const anyError = e as Record<string, unknown>;
    const response = anyError.response as Record<string, unknown> | undefined;
    const body = response?.body as Record<string, unknown> | undefined;
    const code = typeof body?.error_code === "number" ? body.error_code : null;
    const description = typeof body?.description === "string" ? body.description : "";
    const statusCode = typeof response?.statusCode === "number" ? response.statusCode : null;
    const base = e instanceof Error ? e.message : typeof anyError.message === "string" ? anyError.message : "";
    const parts = [base, description].filter(Boolean);
    const suffix = [statusCode ? `http:${statusCode}` : "", code ? `tg:${code}` : ""].filter(Boolean).join(", ");
    const joined = parts.join(" — ").trim();
    const raw = `${joined}${suffix ? ` (${suffix})` : ""}`.trim();
    if (/Legacy API keys are disabled/i.test(raw)) {
      return "Supabase: отключены legacy API keys. Обнови SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY в переменных окружения (актуальные ключи в Supabase → Settings → API).";
    }
    return raw || "Telegram error";
  }
  const raw = e instanceof Error ? e.message : "Telegram error";
  if (/Legacy API keys are disabled/i.test(raw)) {
    return "Supabase: отключены legacy API keys. Обнови SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY в переменных окружения (актуальные ключи в Supabase → Settings → API).";
  }
  return raw;
}

function getBaseUrl(request: Request) {
  const proto = (request.headers.get("x-forwarded-proto") || "").split(",")[0]?.trim() || "";
  const host =
    (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
      .split(",")[0]
      ?.trim() || "";
  if (proto && host) return `${proto}://${host}`;
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}

async function handleTelegramWebhook(request: Request) {
  const { token, chatId, daysWindow } = getTelegramConfig();
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json(
      { error: "На Vercel синхронизация Telegram требует SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY" },
      { status: 501, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  }
  if (!token) {
    return Response.json(
      { error: "TELEGRAM_BOT_TOKEN is not set" },
      { status: 500, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  }

  try {
    const update = (await request.json()) as TelegramBot.Update;
    const anyUpdate = update as unknown as Record<string, unknown>;
    const msg =
      (update as { channel_post?: unknown }).channel_post ||
      (update as { message?: unknown }).message ||
      (anyUpdate.edited_channel_post as unknown) ||
      (anyUpdate.edited_message as unknown) ||
      null;

    const message = msg as
      | {
          chat?: { id?: number };
          message_id?: number;
          date?: number;
          text?: string;
          caption?: string;
          entities?: unknown;
          caption_entities?: unknown;
          media_group_id?: string;
          photo?: Array<{ file_id?: string }>;
          document?: { file_id?: string; mime_type?: string };
        }
      | null;

    if (!message) {
      return Response.json(
        { ok: true, ignored: true },
        { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
      );
    }

    const msgChatId = typeof message.chat?.id === "number" ? message.chat.id : null;
    const msgDate = typeof message.date === "number" ? message.date : null;
    const msgId = typeof message.message_id === "number" ? message.message_id : null;
    if (!msgChatId || msgChatId !== chatId || !msgDate || !msgId) {
      return Response.json(
        { ok: true, ignored: true },
        { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
      );
    }

    const cutoffTs = Math.floor(Date.now() / 1000) - daysWindow * 24 * 60 * 60;
    if (msgDate < cutoffTs) {
      return Response.json(
        { ok: true, ignored: true, reason: "outside_window" },
        { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
      );
    }

    const rawGroupId = typeof message.media_group_id === "string" ? message.media_group_id.trim() : "";
    const groupKey = rawGroupId ? `telegram_media_group:${rawGroupId}` : "";
    const existingGroupRaw = groupKey
      ? await safeReadKv(supabase.client, supabase.table, groupKey)
      : null;

    const existingGroup =
      existingGroupRaw && typeof existingGroupRaw === "object"
        ? (existingGroupRaw as Partial<{
            ids: number[];
            chatId: number;
            date: number;
            text: string;
            entities: TextEntity[];
            photoFileIds: string[];
          }>)
        : null;

    const ids = Array.isArray(existingGroup?.ids)
      ? existingGroup!.ids.filter((n) => typeof n === "number")
      : [];
    if (!ids.includes(msgId)) ids.push(msgId);

    const photoFileIds = Array.isArray(existingGroup?.photoFileIds)
      ? existingGroup!.photoFileIds.filter((s) => typeof s === "string")
      : [];

    const textCandidate = (message.caption || message.text || "").toString();
    const currentText = typeof existingGroup?.text === "string" ? existingGroup!.text : "";
    const nextText = textCandidate.length > currentText.length ? textCandidate : currentText;

    const entsRaw = (message.caption_entities || message.entities || []) as unknown;
    const nextEntities = Array.isArray(entsRaw)
      ? (entsRaw as TextEntity[])
      : Array.isArray(existingGroup?.entities)
        ? existingGroup!.entities
        : [];

    if (Array.isArray(message.photo) && message.photo.length) {
      const last = message.photo[message.photo.length - 1];
      if (last?.file_id) photoFileIds.push(String(last.file_id));
    } else if (
      message.document?.file_id &&
      typeof message.document.mime_type === "string" &&
      message.document.mime_type.startsWith("image/")
    ) {
      photoFileIds.push(String(message.document.file_id));
    }

    const groupState = {
      ids,
      chatId: msgChatId,
      date: Math.max(typeof existingGroup?.date === "number" ? existingGroup!.date : 0, msgDate),
      text: nextText,
      entities: nextEntities,
      photoFileIds: uniqStrings(photoFileIds)
    };

    if (groupKey) {
      await writeKv(supabase.client, supabase.table, groupKey, groupState);
    }

    const minId = groupState.ids.length ? Math.min(...groupState.ids) : msgId;
    const id = String(minId);

    const lastUpdateRaw = await safeReadKv(supabase.client, supabase.table, "telegram_last_update_id");
    const lastUpdateId = typeof lastUpdateRaw === "number" ? lastUpdateRaw : Number(lastUpdateRaw || 0);
    const updateId = Number((update as { update_id?: unknown })?.update_id || 0);
    const maxUpdateId = Math.max(
      Number.isFinite(lastUpdateId) ? lastUpdateId : 0,
      Number.isFinite(updateId) ? updateId : 0
    );

    const byId = new Map<string, MaterialItem>();
    for (const item of asArray(await readKv(supabase.client, supabase.table, "materials"))) {
      byId.set(item.id, item);
    }

    const existingItem = byId.get(id);
    const title = groupState.text.split("\n")[0].substring(0, 100) || "Новый пост";
    const hashtags = (groupState.text.match(/#[a-zа-я0-9_]+/gi) || []).join(" ");
    const publicChatId = msgChatId.toString().replace("-100", "");
    const link = `https://t.me/c/${publicChatId}/${id}`;
    const images = groupState.photoFileIds.map(makeImageUrl);
    const image = images.length ? images[0] : "/ban.png";
    const extractedLinks = extractUrls(groupState.text, groupState.entities);
    const descriptionFromTg = appendMissingLinks(groupState.text, extractedLinks);

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
      existingItem && typeof existingItem.description === "string" ? existingItem.description : "";

    const next: MaterialItem = {
      ...(existingItem || { id }),
      id,
      title: currentTitle && currentTitle !== "Новый пост" ? currentTitle : title,
      hashtag:
        currentHashtag && currentHashtag !== "#новинка" ? currentHashtag : hashtags || "#новинка",
      image: existingItem?.image || image,
      images: Array.isArray(existingItem?.images) ? existingItem?.images : images,
      link,
      description: appendMissingLinks(
        currentDescription.trim().length ? currentDescription : descriptionFromTg,
        extractedLinks
      ),
      date: Math.max(existingItem?.date || 0, groupState.date || 0) || groupState.date
    };

    if (shouldUpdateImages) {
      next.image = image;
      next.images = images;
    }

    byId.set(id, next);
    const added = existingItem ? 0 : 1;

    const combined = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
    await writeKv(supabase.client, supabase.table, "materials", combined);
    if (maxUpdateId > 0) {
      await writeKv(supabase.client, supabase.table, "telegram_last_update_id", maxUpdateId);
    }

    await writeKv(supabase.client, supabase.table, "telegram_last_sync", {
      ok: true,
      at: Date.now(),
      added,
      updates: 1,
      maxUpdateId,
      total: combined.length,
      source: "webhook"
    });

    return Response.json(
      { ok: true, added, total: combined.length, maxUpdateId },
      { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  } catch (e: unknown) {
    const message = describeTelegramError(e);
    try {
      await writeKv(supabase.client, supabase.table, "telegram_last_sync", {
        ok: false,
        at: Date.now(),
        error: message,
        source: "webhook"
      });
    } catch {}
    return Response.json(
      { error: message },
      { status: 500, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  }
}

async function health() {
  const { token, chatId, daysWindow } = getTelegramConfig();
  const supabase = getSupabase();
  if (!token) {
    return Response.json(
      {
        ok: false,
        tokenPresent: false,
        supabasePresent: Boolean(supabase),
        chatId,
        daysWindow
      },
      { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  }

  const bot = new TelegramBot(token, { polling: false });
  let botId: number | null = null;
  let botUsername: string | null = null;
  let webhookUrl: string | null = null;
  let webhookPendingUpdateCount: number | null = null;
  let webhookLastErrorDate: number | null = null;
  let webhookLastErrorMessage: string | null = null;
  let webhookError: string | null = null;
  let chatTitle: string | null = null;
  let chatType: string | null = null;
  let chatUsername: string | null = null;
  let memberStatus: string | null = null;
  let memberError: string | null = null;
  let lastUpdateId: number | null = null;
  let lastSyncRaw: unknown = null;
  let pendingError: string | null = null;
  let pending: Array<{
    update_id: number;
    kind: "channel_post" | "message" | "other";
    chatId?: number;
    messageId?: number;
    date?: number;
  }> = [];
  let pendingAllError: string | null = null;
  let pendingAll: Array<{
    update_id: number;
    kind: "channel_post" | "message" | "other";
    chatId?: number;
    messageId?: number;
    date?: number;
  }> = [];
  try {
    const me = await bot.getMe();
    botId = typeof me?.id === "number" ? me.id : null;
    botUsername = typeof me?.username === "string" ? me.username : null;
  } catch (e: unknown) {
    memberError = e instanceof Error ? e.message : "getMe failed";
  }

  try {
    const info = await bot.getWebHookInfo();
    const anyInfo = info as unknown as Record<string, unknown>;
    webhookUrl = typeof anyInfo.url === "string" ? anyInfo.url : null;
    webhookPendingUpdateCount =
      typeof anyInfo.pending_update_count === "number"
        ? anyInfo.pending_update_count
        : Number(anyInfo.pending_update_count || 0);
    if (!Number.isFinite(webhookPendingUpdateCount)) webhookPendingUpdateCount = null;
    webhookLastErrorDate =
      typeof anyInfo.last_error_date === "number" ? anyInfo.last_error_date : Number(anyInfo.last_error_date || 0);
    if (!Number.isFinite(webhookLastErrorDate) || webhookLastErrorDate <= 0) webhookLastErrorDate = null;
    webhookLastErrorMessage = typeof anyInfo.last_error_message === "string" ? anyInfo.last_error_message : null;
  } catch (e: unknown) {
    webhookError = e instanceof Error ? e.message : "getWebHookInfo failed";
  }

  try {
    const chat = await bot.getChat(chatId);
    chatTitle = typeof (chat as { title?: unknown })?.title === "string" ? (chat as { title: string }).title : null;
    chatType = typeof (chat as { type?: unknown })?.type === "string" ? (chat as { type: string }).type : null;
    chatUsername =
      typeof (chat as { username?: unknown })?.username === "string"
        ? (chat as { username: string }).username
        : null;
  } catch (e: unknown) {
    memberError = memberError || (e instanceof Error ? e.message : "getChat failed");
  }

  if (botId != null) {
    try {
      const member = await bot.getChatMember(chatId, botId);
      memberStatus = typeof (member as { status?: unknown })?.status === "string" ? (member as { status: string }).status : null;
    } catch (e: unknown) {
      memberError = e instanceof Error ? e.message : "getChatMember failed";
    }
  }

  if (!supabase) {
    return Response.json(
      {
        ok: false,
        tokenPresent: true,
        supabasePresent: false,
        chatId,
        daysWindow,
        botUsername,
        webhookUrl,
        webhookError,
        chatTitle,
        chatType,
        chatUsername,
        memberStatus,
        memberError
      },
      { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  }

  const lastUpdateRaw = await safeReadKv(supabase.client, supabase.table, "telegram_last_update_id");
  lastSyncRaw = await safeReadKv(supabase.client, supabase.table, "telegram_last_sync");
  const parsedLastUpdate =
    typeof lastUpdateRaw === "number" ? lastUpdateRaw : Number(lastUpdateRaw || 0);
  lastUpdateId = Number.isFinite(parsedLastUpdate) ? parsedLastUpdate : 0;

  const webhookActive = Boolean(webhookUrl && webhookUrl.trim().length > 0);
  if (!webhookActive) {
    try {
      const offset = lastUpdateId && lastUpdateId > 0 ? lastUpdateId + 1 : undefined;
      const updates = (await bot.getUpdates({
        offset,
        limit: 5,
        allowed_updates: ["channel_post", "message"]
      })) as TelegramBot.Update[];
      pending = updates.map((u) => {
        const msg = u.channel_post || u.message;
        const kind = u.channel_post ? "channel_post" : u.message ? "message" : "other";
        const chatIdValue = typeof msg?.chat?.id === "number" ? msg.chat.id : undefined;
        const messageIdValue = typeof msg?.message_id === "number" ? msg.message_id : undefined;
        const dateValue = typeof msg?.date === "number" ? msg.date : undefined;
        return {
          update_id: Number(u.update_id) || 0,
          kind,
          chatId: chatIdValue,
          messageId: messageIdValue,
          date: dateValue
        };
      });
    } catch (e: unknown) {
      pendingError = describeTelegramError(e);
    }

    try {
      const updates = (await bot.getUpdates({
        limit: 5,
        allowed_updates: ["channel_post", "message"]
      })) as TelegramBot.Update[];
      pendingAll = updates.map((u) => {
        const msg = u.channel_post || u.message;
        const kind = u.channel_post ? "channel_post" : u.message ? "message" : "other";
        const chatIdValue = typeof msg?.chat?.id === "number" ? msg.chat.id : undefined;
        const messageIdValue = typeof msg?.message_id === "number" ? msg.message_id : undefined;
        const dateValue = typeof msg?.date === "number" ? msg.date : undefined;
        return {
          update_id: Number(u.update_id) || 0,
          kind,
          chatId: chatIdValue,
          messageId: messageIdValue,
          date: dateValue
        };
      });
    } catch (e: unknown) {
      pendingAllError = describeTelegramError(e);
    }
  }

  const pendingTarget = pending.filter((p) => p.chatId === chatId).length;
  const pendingOther = pending.filter((p) => typeof p.chatId === "number" && p.chatId !== chatId).length;
  const pendingAllTarget = pendingAll.filter((p) => p.chatId === chatId).length;
  const pendingAllOther = pendingAll.filter((p) => typeof p.chatId === "number" && p.chatId !== chatId).length;
  return Response.json(
    {
      ok: true,
      tokenPresent: true,
      supabasePresent: true,
      chatId,
      daysWindow,
      botUsername,
      webhookUrl,
      webhookPendingUpdateCount,
      webhookLastErrorDate,
      webhookLastErrorMessage,
      webhookError,
      chatTitle,
      memberStatus,
      chatType,
      chatUsername,
      memberError,
      telegram_last_update_id: lastUpdateRaw,
      telegram_last_update_id_num: lastUpdateId,
      telegram_last_sync: lastSyncRaw,
      pendingUpdates: pending,
      pendingUpdatesError: pendingError,
      pendingUpdatesCount: pending.length,
      pendingTargetCount: pendingTarget,
      pendingOtherCount: pendingOther,
      pendingAllUpdates: pendingAll,
      pendingAllUpdatesError: pendingAllError,
      pendingAllUpdatesCount: pendingAll.length,
      pendingAllTargetCount: pendingAllTarget,
      pendingAllOtherCount: pendingAllOther
    },
    { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
  );
}


async function readSeedFromLocalFile(seedCount: number): Promise<MaterialItem[]> {
  if (!seedCount) return [];
  const raw = await fs.readFile(localMaterialsPath, "utf8");
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
  const wantHealth = url?.searchParams.get("health") === "1";
  if (wantHealth && request) {
    return health();
  }
  const setWebhook = url?.searchParams.get("setWebhook") === "1";
  const deleteWebhook = url?.searchParams.get("deleteWebhook") === "1";
  const reset = url?.searchParams.get("reset") === "1";
  const seedCount = asPositiveInt(url?.searchParams.get("seed"));
  const seedOnly = url?.searchParams.get("seedOnly") === "1";
  const forceSeed = url?.searchParams.get("forceSeed") === "1";
  const { token, chatId, daysWindow } = getTelegramConfig();

  try {
    if ((setWebhook || deleteWebhook) && request) {
      const secret = getTelegramSecret();
      if (!token) {
        return Response.json(
          { error: "TELEGRAM_BOT_TOKEN is not set" },
          { status: 500, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
        );
      }
      const bot = new TelegramBot(token, { polling: false });
      if (deleteWebhook) {
        await bot.deleteWebHook();
      } else {
        if (!secret) {
          return Response.json(
            { error: "SYNC_TELEGRAM_SECRET (or SYNC_TELEGRAM_SECRE) is not set" },
            { status: 500, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
          );
        }
        const base = getBaseUrl(request);
        const path = new URL(request.url).pathname;
        await (bot as unknown as { setWebHook: (url: string, options?: unknown) => Promise<unknown> }).setWebHook(
          `${base}${path}`,
          { secret_token: secret }
        );
      }
      const info = await bot.getWebHookInfo();
      const urlValue =
        typeof (info as { url?: unknown })?.url === "string" ? (info as { url: string }).url : "";
      return Response.json(
        { ok: true, webhookUrl: urlValue || "" },
        { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
      );
    }

    const isVercel = Boolean(process.env.VERCEL);
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
      if (!isVercel) {
        const readKey = async (key: string) => readLocalKey(key);
        const writeKey = async (key: string, value: unknown) => writeLocalKey(key, value);
        const readMaterials = async () => readLocalMaterials();
        const writeMaterials = async (list: MaterialItem[]) => writeJsonFile(localMaterialsPath, list);

        const lastUpdateRaw = await readKey("telegram_last_update_id");
        const lastUpdateId = typeof lastUpdateRaw === "number" ? lastUpdateRaw : Number(lastUpdateRaw || 0);
        const byId = new Map<string, MaterialItem>();
        for (const item of await readMaterials()) {
          byId.set(item.id, item);
        }

        if (reset) {
          await writeKey("telegram_last_update_id", 0);
          await writeKey("telegram_last_sync", {
            ok: true,
            at: Date.now(),
            reset: true
          });
          return Response.json(
            { ok: true, reset: true },
            { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
          );
        }

        let updatesCount = 0;
        let added = 0;
        let maxUpdateId = lastUpdateId || 0;
        let webhookCleared: boolean | undefined = undefined;
        let webhookUrlAtSync: string | undefined = undefined;
        let webhookClearError: string | undefined = undefined;
        let webhookActive: boolean | undefined = undefined;

        if (!seedOnly) {
          if (!token) {
            if (!seedCount) {
              return Response.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
            }
          } else {
            const bot = new TelegramBot(token, { polling: false });
            try {
              const info = await bot.getWebHookInfo();
              const urlValue =
                typeof (info as { url?: unknown })?.url === "string" ? (info as { url: string }).url : "";
              webhookUrlAtSync = urlValue || undefined;
              webhookCleared = false;
              webhookActive = Boolean(urlValue);
            } catch (e: unknown) {
              webhookClearError = describeTelegramError(e);
            }

            const cutoffTs = Math.floor(Date.now() / 1000) - daysWindow * 24 * 60 * 60;
            const offsetStart =
              Number.isFinite(lastUpdateId) && lastUpdateId > 0 ? lastUpdateId + 1 : undefined;

            const maxUpdatesPerSync = getTelegramMaxUpdatesPerSync();
            const updates: TelegramBot.Update[] = [];
            if (!webhookActive) {
              let offset = offsetStart;
              while (updates.length < maxUpdatesPerSync) {
                const limit = Math.min(100, maxUpdatesPerSync - updates.length);
                if (limit <= 0) break;
                let batch: TelegramBot.Update[] = [];
                try {
                  batch = (await bot.getUpdates({
                    offset,
                    limit,
                    allowed_updates: ["channel_post", "message"]
                  })) as TelegramBot.Update[];
                } catch (e: unknown) {
                  throw new Error(describeTelegramError(e));
                }
                if (!batch.length) break;
                updates.push(...batch);
                offset = batch[batch.length - 1]!.update_id + 1;
                if (batch.length < limit) break;
              }
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

              const key = msg.media_group_id ? `group:${msg.media_group_id}` : `single:${msg.message_id}`;
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
                existingItem && typeof existingItem.description === "string" ? existingItem.description : "";

              const next: MaterialItem = {
                ...(existingItem || { id }),
                id,
                title: currentTitle && currentTitle !== "Новый пост" ? currentTitle : title,
                hashtag:
                  currentHashtag && currentHashtag !== "#новинка" ? currentHashtag : hashtags || "#новинка",
                image: existingItem?.image || image,
                images: Array.isArray(existingItem?.images) ? existingItem?.images : images,
                link,
                description: appendMissingLinks(
                  currentDescription.trim().length ? currentDescription : descriptionFromTg,
                  extractedLinks
                ),
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
          const seedItems = await readSeedFromLocalFile(seedCount);
          if (forceSeed) {
            for (const it of seedItems) {
              if (byId.has(it.id)) continue;
              byId.set(it.id, it);
              seeded++;
            }
          } else if (byId.size < seedCount) {
            for (const it of seedItems) {
              if (byId.has(it.id)) continue;
              byId.set(it.id, it);
              seeded++;
              if (byId.size >= seedCount) break;
            }
          }
        }

        const combined = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
        await writeMaterials(combined);
        await writeKey("telegram_last_update_id", maxUpdateId);
        await writeKey("telegram_last_sync", {
          ok: true,
          at: Date.now(),
          added,
          updates: updatesCount,
          maxUpdateId,
          total: combined.length,
          webhookCleared,
          webhookActive,
          webhookUrl: webhookUrlAtSync,
          webhookError: webhookClearError,
          storage: "local"
        });

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
      return Response.json(
        { error: "На Vercel синхронизация Telegram требует SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY" },
        { status: 501, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
      );
    }

    const lastUpdateRaw = await readKv(supabase.client, supabase.table, "telegram_last_update_id");
    const lastUpdateId = typeof lastUpdateRaw === "number" ? lastUpdateRaw : Number(lastUpdateRaw || 0);
    const byId = new Map<string, MaterialItem>();
    for (const item of asArray(await readKv(supabase.client, supabase.table, "materials"))) {
      byId.set(item.id, item);
    }

    if (reset) {
      await writeKv(supabase.client, supabase.table, "telegram_last_update_id", 0);
      await writeKv(supabase.client, supabase.table, "telegram_last_sync", {
        ok: true,
        at: Date.now(),
        reset: true
      });
      return Response.json(
        { ok: true, reset: true },
        { headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
      );
    }

    let updatesCount = 0;
    let added = 0;
    let maxUpdateId = lastUpdateId || 0;
    let webhookCleared: boolean | undefined = undefined;
    let webhookUrlAtSync: string | undefined = undefined;
    let webhookClearError: string | undefined = undefined;
    let webhookActive: boolean | undefined = undefined;

    if (!seedOnly) {
      if (!token) {
        if (!seedCount) {
          return Response.json({ error: "TELEGRAM_BOT_TOKEN is not set" }, { status: 500 });
        }
      } else {
        const bot = new TelegramBot(token, { polling: false });
        try {
          const info = await bot.getWebHookInfo();
          const urlValue =
            typeof (info as { url?: unknown })?.url === "string" ? (info as { url: string }).url : "";
          webhookUrlAtSync = urlValue || undefined;
          webhookCleared = false;
          webhookActive = Boolean(urlValue);
        } catch (e: unknown) {
          webhookClearError = describeTelegramError(e);
        }

        const cutoffTs = Math.floor(Date.now() / 1000) - daysWindow * 24 * 60 * 60;
        const offsetStart =
          Number.isFinite(lastUpdateId) && lastUpdateId > 0 ? lastUpdateId + 1 : undefined;

        const maxUpdatesPerSync = getTelegramMaxUpdatesPerSync();
        const updates: TelegramBot.Update[] = [];
        if (webhookActive && request && isAdminAuthorized(request)) {
          try {
            await bot.deleteWebHook();
            webhookCleared = true;
            webhookActive = false;
          } catch (e: unknown) {
            webhookClearError = describeTelegramError(e);
          }
        }
        if (!webhookActive) {
          let offset = offsetStart;
          while (updates.length < maxUpdatesPerSync) {
            const limit = Math.min(100, maxUpdatesPerSync - updates.length);
            if (limit <= 0) break;
            let batch: TelegramBot.Update[] = [];
            try {
              batch = (await bot.getUpdates({
                offset,
                limit,
                allowed_updates: ["channel_post", "message"]
              })) as TelegramBot.Update[];
            } catch (e: unknown) {
              throw new Error(describeTelegramError(e));
            }
            if (!batch.length) break;
            updates.push(...batch);
            offset = batch[batch.length - 1]!.update_id + 1;
            if (batch.length < limit) break;
          }
        }
        if (request && webhookUrlAtSync && !webhookActive && isAdminAuthorized(request)) {
          const secret = getTelegramSecret();
          if (secret) {
            try {
              const base = getBaseUrl(request);
              const path = new URL(request.url).pathname;
              await (bot as unknown as { setWebHook: (url: string, options?: unknown) => Promise<unknown> }).setWebHook(
                `${base}${path}`,
                { secret_token: secret }
              );
              webhookActive = true;
              webhookUrlAtSync = `${base}${path}`;
            } catch (e: unknown) {
              webhookClearError = webhookClearError || describeTelegramError(e);
            }
          }
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
      const seedItems = await readSeedFromLocalFile(seedCount);
      if (forceSeed) {
        for (const it of seedItems) {
          if (byId.has(it.id)) continue;
          byId.set(it.id, it);
          seeded++;
        }
      } else if (byId.size < seedCount) {
        for (const it of seedItems) {
          if (byId.has(it.id)) continue;
          byId.set(it.id, it);
          seeded++;
          if (byId.size >= seedCount) break;
        }
      }
    }

    const combined = Array.from(byId.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
    await writeKv(supabase.client, supabase.table, "materials", combined);
    await writeKv(supabase.client, supabase.table, "telegram_last_update_id", maxUpdateId);

    await writeKv(supabase.client, supabase.table, "telegram_last_sync", {
      ok: true,
      at: Date.now(),
      added,
      updates: updatesCount,
      maxUpdateId,
      total: combined.length,
      webhookCleared,
      webhookActive,
      webhookUrl: webhookUrlAtSync,
      webhookError: webhookClearError
    });

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
  } catch (e: unknown) {
    const message = describeTelegramError(e);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await writeKv(supabase.client, supabase.table, "telegram_last_sync", {
          ok: false,
          at: Date.now(),
          error: message
        });
      } catch {}
    } else if (!process.env.VERCEL) {
      try {
        await writeLocalKey("telegram_last_sync", {
          ok: false,
          at: Date.now(),
          error: message,
          storage: "local"
        });
      } catch {}
    }
    return Response.json(
      { error: message },
      { status: 500, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } }
    );
  }
}
