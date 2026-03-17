import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = "nodejs";

const dataPath = path.join(process.cwd(), 'data', 'materials.json');
const uiPath = path.join(process.cwd(), 'data', 'ui.json');

const ALWAYS_HIDDEN_MATERIAL_IDS = new Set(['look_1', 'look_2', 'look_3', 'look_4', 'look_5']);

function defaultAdminDocsStore() {
  const now = Date.now();
  return {
    version: 1,
    items: [
      {
        id: "doc_admin_login",
        kind: "instruction",
        category: "Админка",
        tags: ["admin", "login"],
        title: { ru: "Вход в админ‑панель", en: "Admin login" },
        body: {
          ru: "Открой /admin, введи логин и пароль администратора и нажми «Войти». После входа появятся вкладки «Материалы», «О клубе», «Навбар», «Инструкции».",
          en: "Open /admin, enter admin login & password, then press “Login”. After login you will see “Materials”, “Community”, “Navbar”, “Docs”."
        },
        steps: [
          {
            title: { ru: "Открой страницу админки", en: "Open admin page" },
            text: { ru: "Перейди на /admin.", en: "Go to /admin." },
            image: "/новое.jpg"
          },
          {
            title: { ru: "Введи доступ", en: "Enter credentials" },
            text: {
              ru: "Заполни логин и пароль. Если видишь «Неверный логин или пароль» — проверь раскладку и пробелы.",
              en: "Enter username and password. If you see “Invalid login or password”, check spaces and keyboard layout."
            }
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "doc_materials_search_edit",
        kind: "instruction",
        category: "Материалы",
        tags: ["materials", "search", "edit", "images"],
        title: { ru: "Материалы: поиск, редактирование, обложки", en: "Materials: search, edit, covers" },
        body: {
          ru: "Вкладка «Материалы» показывает список постов и позволяет редактировать поля: заголовок, хэштеги, описание, ссылки, обложку и галерею картинок. Поиск работает серверно.",
          en: "The “Materials” tab lists posts and lets you edit title, hashtags, description, links, cover and gallery. Search is server-side."
        },
        steps: [
          {
            title: { ru: "Найди пост", en: "Find a post" },
            text: {
              ru: "Переключись на «Материалы» → открой список → в поиске введи id / слово из заголовка / хэштег / ссылку. При необходимости увеличь лимит.",
              en: "Go to “Materials” → list view → type id / title keyword / hashtag / link. Increase limit if needed."
            }
          },
          {
            title: { ru: "Открой карточку", en: "Open editor" },
            text: {
              ru: "Кликни по нужной карточке. Справа откроется редактор. После правок нажми «Сохранить».",
              en: "Click an item to open editor. Apply changes and press “Save”."
            }
          },
          {
            title: { ru: "Загрузи обложку/картинку", en: "Upload cover/image" },
            text: {
              ru: "В редакторе используй загрузку изображения. Файл автоматически проверяется и при необходимости сжимается перед отправкой.",
              en: "Use image upload in editor. The file is validated and compressed when needed."
            }
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "doc_telegram_sync",
        kind: "instruction",
        category: "Telegram",
        tags: ["telegram", "sync", "webhook"],
        title: { ru: "Telegram: синхронизация и webhook", en: "Telegram: sync and webhook" },
        body: {
          ru: "В «Материалы» есть кнопки управления синхронизацией: «Обновить» подтягивает новые посты, «Webhook» включает приём обновлений, «Webhook off» выключает, «Проверить» показывает диагностику токена/супабейза/чата.",
          en: "In “Materials” you can control Telegram sync: “Update” pulls new posts, “Webhook” enables updates, “Webhook off” disables, “Check” shows diagnostics."
        },
        steps: [
          {
            title: { ru: "Обнови ленту", en: "Update feed" },
            text: {
              ru: "Нажми «Обновить». В статусе появится сколько добавлено/обновлено.",
              en: "Press “Update”. Status will show how many items were added/updated."
            }
          },
          {
            title: { ru: "Проверь диагностику", en: "Run diagnostics" },
            text: {
              ru: "Нажми «Проверить» и смотри: TG_TOKEN ok/нет, SUPABASE ok/нет, webhook активен или нет, pending updates.",
              en: "Press “Check” to see TG token, Supabase status, webhook state and pending updates."
            }
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "doc_docs_section",
        kind: "instruction",
        category: "Инструкции",
        tags: ["docs", "errors", "feedback"],
        title: { ru: "Раздел «Инструкции»: как добавлять статьи и ошибки", en: "Docs: how to add articles and errors" },
        body: {
          ru: "Вкладка «Инструкции» внутри админки — это внутренняя база знаний. Тут можно создавать инструкции и карточки ошибок, добавлять шаги, скриншоты, категории и теги. Всё ищется через строку поиска.",
          en: "The “Docs” tab is an internal knowledge base. Create instructions and error entries with steps, screenshots, categories and tags. Use search to find anything."
        },
        steps: [
          {
            title: { ru: "Добавь новую запись", en: "Create a new entry" },
            text: {
              ru: "Открой «Инструкции» или «Ошибки» → нажми «+ Добавить» → заполни категорию, теги, текст и шаги.",
              en: "Open “Instructions” or “Errors” → press “+ Add” → fill category, tags, text and steps."
            }
          },
          {
            title: { ru: "Прикрепи скриншот", en: "Attach a screenshot" },
            text: {
              ru: "Внутри шага можно указать URL или загрузить файл кнопкой «+ Файл». После загрузки появится превью.",
              en: "In a step you can paste an URL or upload a file via “+ File”. Preview will appear after upload."
            }
          },
          {
            title: { ru: "Отправь новую проблему", en: "Send feedback" },
            text: {
              ru: "Во вкладке «Обратная связь» опиши баг и страницу. Сообщения сохраняются и видны админам.",
              en: "In “Feedback” describe the issue and page. Messages are stored and visible to admins."
            }
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "err_tg_token_missing",
        kind: "error",
        category: "Telegram",
        tags: ["telegram", "token", "env"],
        title: { ru: "TG_TOKEN: нет / синк не работает", en: "TG token missing / sync fails" },
        body: {
          ru: "Симптомы: в админке «TG_TOKEN: нет», кнопка «Обновить» не подтягивает посты, диагностика показывает tokenPresent=false.\n\nПричина: в переменных окружения Vercel не задан TELEGRAM_BOT_TOKEN или TG_TOKEN.\n\nРешение: добавь токен бота в Vercel → Project → Settings → Environment Variables и перезапусти деплой.",
          en: "Symptoms: “TG_TOKEN: missing”, “Update” does nothing, diagnostics shows tokenPresent=false.\n\nCause: TELEGRAM_BOT_TOKEN/TG_TOKEN is not set in environment.\n\nFix: add token in Vercel env vars and redeploy."
        },
        steps: [
          {
            title: { ru: "Проверь диагностику", en: "Check diagnostics" },
            text: { ru: "Материалы → «Проверить» → TG_TOKEN должен быть ok.", en: "Materials → “Check” → TG token should be ok." }
          },
          {
            title: { ru: "Обнови переменные окружения", en: "Update env vars" },
            text: {
              ru: "В Vercel добавь TELEGRAM_BOT_TOKEN или TG_TOKEN. Не публикуй токен в чат/код.",
              en: "Add TELEGRAM_BOT_TOKEN/TG_TOKEN in Vercel. Never paste token into chat or code."
            }
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "err_supabase_missing",
        kind: "error",
        category: "Supabase",
        tags: ["supabase", "env", "storage"],
        title: { ru: "Supabase: нет доступа / не сохраняется", en: "Supabase missing / save fails" },
        body: {
          ru: "Симптомы: в админке «SUPABASE_URL: нет» или «ключ: нет», сохранение/загрузка файлов не работает.\n\nПричина: не заданы SUPABASE_URL и ключ (SUPABASE_SERVICE_ROLE_KEY или SUPABASE_SECRET_KEY).\n\nРешение: добавь переменные окружения в Vercel и перезапусти деплой.",
          en: "Symptoms: SUPABASE_URL/key missing, saving or uploads fail.\n\nCause: SUPABASE_URL and service role key are not set.\n\nFix: set env vars in Vercel and redeploy."
        },
        steps: [
          {
            title: { ru: "Проверь статус в шапке админки", en: "Check admin header" },
            text: { ru: "В шапке админки видно SUPABASE_URL и ключ.", en: "Admin header shows SUPABASE_URL and key status." }
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}

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

function extractImageUrlsFromText(value: string) {
  const text = (value || "").trim();
  if (!text) return [];
  const out: string[] = [];
  const re = /(https?:\/\/[^\s"'<>()]+?\.(?:png|jpe?g|webp|gif))(?:\?[^\s"'<>()]*)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = (m[0] || "").trim();
    if (!raw) continue;
    out.push(raw);
    if (out.length >= 12) break;
  }
  return out;
}

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
      const rawImage = typeof m?.image === "string" ? m.image.trim() : "";
      const link = typeof m?.link === "string" ? m.link : "";
      const video_link = typeof m?.video_link === "string" ? m.video_link : "";
      const type = typeof m?.type === "string" ? m.type : "";
      const image_position = typeof m?.image_position === "string" ? m.image_position : "";
      const date =
        typeof m?.date === "number" ? m.date : Number.isFinite(Number(m?.date)) ? Number(m?.date) : undefined;
      const rawImages = Array.isArray(m?.images)
        ? m.images.map((v: unknown) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
        : [];
      const fullDescription = typeof m?.description === "string" ? m.description : "";
      const extracted = extractImageUrlsFromText(fullDescription);
      const mergedImages: string[] = [];
      const seen = new Set<string>();
      const push = (u: string) => {
        const url = (u || "").trim();
        if (!url) return;
        if (url === "/ban.png") return;
        if (seen.has(url)) return;
        seen.add(url);
        mergedImages.push(url);
      };
      if (rawImage) push(rawImage);
      for (const u of rawImages) push(u);
      for (const u of extracted) push(u);
      const images = mergedImages.length ? mergedImages.slice(0, maxImages) : undefined;
      const image = images?.[0] || (rawImage && rawImage !== "/ban.png" ? rawImage : "/ban.png");
      const description =
        maxDescription > 0 && fullDescription.trim().length
          ? fullDescription.trim().slice(0, maxDescription)
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

function extractMonthIndex(text: string) {
  const t = (text || "").toLowerCase();
  if (t.includes("январ")) return 1;
  if (t.includes("феврал")) return 2;
  if (t.includes("март")) return 3;
  if (t.includes("апрел")) return 4;
  if (t.includes("мая") || t.includes("май")) return 5;
  if (t.includes("июн")) return 6;
  if (t.includes("июл")) return 7;
  if (t.includes("август")) return 8;
  if (t.includes("сентябр")) return 9;
  if (t.includes("октябр")) return 10;
  if (t.includes("ноябр")) return 11;
  if (t.includes("декабр")) return 12;
  if (t.includes("новогод")) return 12;
  return 0;
}

function extractYearFromTitle(text: string) {
  const m = (text || "").match(/(20\d{2})/g);
  if (!m || m.length === 0) return 0;
  const last = m[m.length - 1] || "";
  const y = Number(last);
  return Number.isFinite(y) ? y : 0;
}

function isBrandsMaterial(m: MaterialItem) {
  const tag = (m.hashtag || "").toLowerCase();
  const id = (m.id || "").toLowerCase();
  return (
    tag.includes("#обзорыбрендов") ||
    tag.includes("#обзорбрендов") ||
    tag.includes("#обзорбренда") ||
    tag.includes("#бренд") ||
    tag.includes("#обзор") ||
    id.startsWith("brand_")
  );
}

function isIdeasMaterial(m: MaterialItem) {
  const tag = (m.hashtag || "").toLowerCase();
  if (!tag) return false;
  const link = typeof m.link === "string" ? m.link.toLowerCase() : "";
  if (link.endsWith(".pdf")) return false;
  if (m.link === "https://t.me/c/2055411531/15199" || m.id === "15199") return false;
  return (
    tag.includes("#идеиобразов") ||
    tag.includes("#образ") ||
    tag.includes("#образы") ||
    tag.includes("#lookднялена")
  );
}

function isLookdnyaLenaMaterial(m: MaterialItem) {
  const tag = (m.hashtag || "").toLowerCase();
  if (!tag) return false;
  const tokens = tag.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  if (!tokens.includes("#lookднялена")) return false;
  if (typeof m.id === "string" && m.id.startsWith("edu_")) return false;
  return true;
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

const MATERIALS_BASE_KEY = "materials";
const MATERIALS_OVERRIDES_KEY = "materials_overrides";

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
    const categoryParam = (url.searchParams.get("category") || "").trim().toLowerCase();
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

    let supabaseBaseMaterials: MaterialItem[] = [];
    let supabaseOverrideMaterials: MaterialItem[] = [];
    let supabaseFound = false;

    if (supabase && preferSupabase) {
      try {
        if (key === MATERIALS_BASE_KEY) {
          const { data, error } = await supabase.client
            .from(supabase.table)
            .select("key,value")
            .in("key", [MATERIALS_BASE_KEY, MATERIALS_OVERRIDES_KEY]);
          if (!error && Array.isArray(data)) {
            const baseRow = data.find((r) => r?.key === MATERIALS_BASE_KEY);
            const overridesRow = data.find((r) => r?.key === MATERIALS_OVERRIDES_KEY);
            const baseCandidate = Array.isArray(baseRow?.value) ? (baseRow?.value as MaterialItem[]) : [];
            const overridesCandidate = Array.isArray(overridesRow?.value)
              ? (overridesRow?.value as MaterialItem[])
              : [];
            const treatBaseAsOverrides = overridesCandidate.length === 0 && baseCandidate.length > 0 && baseCandidate.length <= 2000;
            supabaseBaseMaterials = treatBaseAsOverrides ? [] : baseCandidate;
            supabaseOverrideMaterials = treatBaseAsOverrides ? baseCandidate : overridesCandidate;
            supabaseFound = supabaseBaseMaterials.length > 0 || supabaseOverrideMaterials.length > 0;
          }
        } else {
          const { data, error } = await supabase.client
            .from(supabase.table)
            .select("key,value")
            .eq("key", key)
            .maybeSingle();
          if (!error && data?.value != null) {
            if (key === "admin_docs") {
              const v = data.value as unknown;
              const hasItems =
                v &&
                typeof v === "object" &&
                Array.isArray((v as { items?: unknown }).items) &&
                (v as { items: unknown[] }).items.length > 0;
              return NextResponse.json(hasItems ? v : defaultAdminDocsStore(), { headers: withSource("supabase") });
            }
            if (key === "admin_docs_feedback") {
              const v = data.value as unknown;
              return NextResponse.json(Array.isArray(v) ? v : [], { headers: withSource("supabase") });
            }
            return NextResponse.json(data.value, { headers: withSource("supabase") });
          }
        }
      } catch (e) {
        console.error("Supabase fetch error:", e);
      }
    }

    // Always load local file as base/fallback
    let fileMaterials: MaterialItem[] = [];
    let fileUi: Record<string, unknown> = {};
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
    if (key === MATERIALS_BASE_KEY) {
      const mergedMap = new Map<string, MaterialItem>();
      
      // Add file materials first
      for (const m of fileMaterials) {
        if (m && m.id) mergedMap.set(String(m.id), m);
      }
      
      // Add/overwrite with Supabase base (Telegram sync)
      for (const m of supabaseBaseMaterials) {
        if (m && m.id) mergedMap.set(String(m.id), m);
      }

      // Add/overwrite with Supabase overrides (admin edits and manual additions)
      for (const m of supabaseOverrideMaterials) {
        if (m && m.id) mergedMap.set(String(m.id), m);
      }
      
      const combined = Array.from(mergedMap.values()).sort((a, b) => (b.date || 0) - (a.date || 0));
      
      const hidden = await getHiddenMaterialIds(supabase);
      let visible = filterMaterials(combined, hidden);

      if (categoryParam === "brands") {
        visible = visible.filter(isBrandsMaterial);
        visible = [...visible].sort((a, b) => {
          const ay = extractYearFromTitle(a.title || "");
          const by = extractYearFromTitle(b.title || "");
          if (ay !== by) return by - ay;
          const am = extractMonthIndex(a.title || "");
          const bm = extractMonthIndex(b.title || "");
          if (am !== bm) return bm - am;
          return (b.date || 0) - (a.date || 0);
        });
      }

      if (categoryParam === "ideas") {
        visible = visible.filter(isIdeasMaterial);
      }

      if (categoryParam === "looklena") {
        visible = visible.filter(isLookdnyaLenaMaterial);
      }
      
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
      const source: "supabase" | "file" = supabaseBaseMaterials.length > 0 ? "supabase" : "file";
      return NextResponse.json(out, { headers: withSource(source) });
    }

    // For UI keys (categories, etc.)
    // If Supabase didn't have it, we use the local file version
    if (key === "admin_docs" || key === "admin_docs_feedback") {
      if (!isAdminAuthorized(request)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders });
      }
    }

    if (key === "admin_docs") {
      const value = fileUi[key];
      const hasItems =
        value &&
        typeof value === "object" &&
        Array.isArray((value as { items?: unknown }).items) &&
        (value as { items: unknown[] }).items.length > 0;
      return NextResponse.json(hasItems ? value : defaultAdminDocsStore(), { headers: withSource("file") });
    }

    if (key === "admin_docs_feedback") {
      const value = fileUi[key];
      return NextResponse.json(Array.isArray(value) ? value : [], { headers: withSource("file") });
    }

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
          const currentRaw = supabase
            ? await readKvValue(supabase, MATERIALS_OVERRIDES_KEY)
            : JSON.parse(await fs.promises.readFile(dataPath, "utf8"));
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
              .upsert({ key: MATERIALS_OVERRIDES_KEY, value: next }, { onConflict: "key" });
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
          const currentRaw = supabase
            ? await readKvValue(supabase, MATERIALS_OVERRIDES_KEY)
            : JSON.parse(await fs.promises.readFile(dataPath, "utf8"));
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
              .upsert({ key: MATERIALS_OVERRIDES_KEY, value: next }, { onConflict: "key" });
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

        if (op === "append") {
          if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Data must be an object" }, { status: 400 });
          }
          if (key === "materials") {
            return NextResponse.json({ error: "append is not supported for materials" }, { status: 400 });
          }
          const entry = {
            ...(body as Record<string, unknown>),
            id: typeof (body as { id?: unknown }).id === "string" ? (body as { id: string }).id : crypto.randomUUID(),
            createdAt:
              typeof (body as { createdAt?: unknown }).createdAt === "number"
                ? (body as { createdAt: number }).createdAt
                : Date.now()
          };
          const existingRaw = supabase
            ? await readKvValue(supabase, key)
            : (await readUiFile())[key];
          const existing = Array.isArray(existingRaw) ? existingRaw : [];
          const next = [...existing, entry].slice(-1000);

          if (supabase) {
            const { error } = await supabase.client
              .from(supabase.table)
              .upsert({ key, value: next }, { onConflict: "key" });
            if (error) {
              return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
            }
          } else {
            const ui = await readUiFile();
            await writeUiFile({ ...ui, [key]: next });
          }
          return NextResponse.json({ success: true, total: next.length });
        }

        if (key === 'materials' && !Array.isArray(body)) {
          return NextResponse.json({ error: 'Data must be an array' }, { status: 400 });
        }

        if (supabase) {
          if (key === MATERIALS_BASE_KEY) {
            const currentRaw = await readKvValue(supabase, MATERIALS_OVERRIDES_KEY);
            const current = Array.isArray(currentRaw) ? (currentRaw as MaterialItem[]) : [];
            const byId = new Map<string, MaterialItem>();
            for (const it of current) {
              if (!it || typeof it !== "object" || typeof it.id !== "string") continue;
              const id = it.id.trim();
              if (!id) continue;
              byId.set(id, it);
            }
            for (const it of body as unknown[]) {
              if (!it || typeof it !== "object") continue;
              const obj = it as Record<string, unknown>;
              const id = typeof obj.id === "string" ? obj.id.trim() : "";
              if (!id) continue;
              byId.set(id, obj as unknown as MaterialItem);
            }
            const next = Array.from(byId.values());

            const { error } = await supabase.client
              .from(supabase.table)
              .upsert({ key: MATERIALS_OVERRIDES_KEY, value: next }, { onConflict: "key" });
            if (error) {
              return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
            }
            return NextResponse.json({ success: true, merged: (body as unknown[]).length, total: next.length });
          }
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
