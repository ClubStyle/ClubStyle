"use client";

import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, Search, X } from "lucide-react";
import BottomNav from "../../components/BottomNav";

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
  type?: string;
  image_position?: string;
};

type BottomNavItem = {
  href: string;
  label: string;
  icon: "home" | "users" | "heart";
};

type TelegramSyncStatus = {
  ok?: boolean;
  at?: number;
  added?: number;
  updates?: number;
  error?: string;
};

type BottomNavConfig = {
  items: BottomNavItem[];
  innerClassName: string;
};

type QuickFilter = { label: string; category: string };

type CategoryConfig = {
  name: string;
  subCategories?: string[];
  hidden?: boolean;
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

function SafeImage({
  src,
  alt,
  onError,
  ...props
}: Omit<ImageProps, "src"> & { src: ImageProps["src"] }) {
  const isUploads = typeof src === "string" && src.startsWith("/uploads/");
  const isWikimedia =
    typeof src === "string" && src.startsWith("https://upload.wikimedia.org/");
  const isTelegramFile = typeof src === "string" && src.startsWith("/api/telegram-file?");
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      unoptimized={isUploads || isWikimedia || isTelegramFile}
      onError={(e) => {
        onError?.(e);
        const target = e.currentTarget as HTMLImageElement | null;
        if (target && target.getAttribute("src") !== "/ban.png") {
          target.setAttribute("src", "/ban.png");
        }
      }}
    />
  );
}

function pickStringField(value: unknown, key: string) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const v = record[key];
  return typeof v === "string" ? v : null;
}

const DEFAULT_MENU_ITEMS = [
  { title: "ОБЗОРЫ БРЕНДОВ", image: "/obzorybrendov.png", category: "Бренды" },
  { title: "ИДЕИ ОБРАЗОВ", image: "/ideiobrazov.png", category: "Идеи образов" },
  { title: "#LOOKДНЯЛЕНА", image: "/obrazy.png", category: "#lookдняЛена" },
  { title: "МАСТЕР-КЛАССЫ", image: "/masterklassy.png", category: "Мастер-классы" },
  { title: "ГАЙДЫ", image: "/gaydy2.png", category: "Гайды и чек-листы" },
  { title: "ЭФИРЫ", image: "/efiry2.png", category: "Эфиры" },
  { title: "ОБУЧЕНИЯ", image: "/obucheniya.png", category: "Мои обучения" },
  { title: "СОВЕТЫ И ЛАЙФХАКИ", image: "/sovetylayf.png", category: "Советы" }
];

const DEFAULT_QUICK_FILTERS: QuickFilter[] = [
  { label: "типы фигур", category: "Типы фигуры" },
  { label: "plus size", category: "Plus Size" },
  { label: "находки рф", category: "Покупки по РФ" },
  { label: "находки мир", category: "Покупки по миру" },
  { label: "обувь", category: "Обувь" },
  { label: "сумки", category: "TGSEARCH:сумки" },
  { label: "верхняя одежда", category: "Верхняя одежда" },
  { label: "верха", category: "Верха" },
  { label: "низы", category: "Низы" },
  { label: "аксессуары", category: "Аксессуары" },
  { label: "образы участниц", category: "LINK:https://t.me/c/2249399970/230/33059" }
];

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    name: "Сообщество",
    hidden: true,
    subCategories: ["Эфиры", "Мастер-классы", "Гайды и чек-листы", "Мои обучения", "Разбор образов участниц"]
  },
  { name: "Эфиры" },
  { name: "Мастер-классы" },
  { name: "Гайды и чек-листы" },
  {
    name: "Мои обучения",
    subCategories: [
      "Гайд Базовый гардероб",
      "Стилист будущего",
      "10 = 100",
      "Мастер-класс ПРОКАЧКА СТИЛЯ",
      "Мастер-класс Тренды 2026",
      "УКРАШЕНИЯ: как выбирать, сочетать и хранить",
      "Чек-лист по ПОДБОРУ СУМОК"
    ]
  },
  { name: "Бренды" },
  {
    name: "Типы фигуры",
    subCategories: ["Груша", "Яблоко", "Песочные часы", "Перевернутый треугольник", "Прямоугольник"]
  },
  { name: "#lookдняЛена" },
  { name: "Идеи образов" },
  { name: "Ссылки на вещи" },
  { name: "Вещь дня" },
  {
    name: "Обувь",
    subCategories: [
      "Босоножки",
      "Мюли",
      "Сабо",
      "Туфли",
      "Балетки",
      "Ботинки",
      "Ботильоны",
      "Сапоги",
      "Тапки",
      "Угги",
      "Кеды",
      "Кроссовки"
    ]
  },
  {
    name: "Верха",
    subCategories: ["Топ", "Футболка", "Лонгслив", "Майка", "Кардиган", "Жакет", "Жилет", "Блузка", "Рубашка", "Корсет"]
  },
  { name: "Низы", subCategories: ["Брюки", "Юбка", "Джинсы", "Шорты", "Бермуды", "Легинсы", "Комбинезон", "Платье"] },
  {
    name: "Аксессуары",
    subCategories: ["Украшения", "Носки", "Гольфы", "Колготки", "Варежки", "Перчатки", "Платок", "Шапка", "Капор", "Шарф", "Очки"]
  },
  { name: "Сумки", subCategories: ["Сумки"] },
  { name: "Купальники", subCategories: ["Купальники"] },
  {
    name: "Верхняя одежда",
    subCategories: ["Куртка", "Пальто", "Дубленка", "Шуба", "Парка", "Косуха", "Бомбер"]
  },
  { name: "Plus Size" },
  {
    name: "Сезоны",
    subCategories: ["Лето", "Зима", "Демисезон", "Осенние образы для работы", "Повседневные осенние образы", "Верхняя одежда на осень", "Осенние образы с трикотажем", "Обувь и аксессуары на осень", "Осенние капсулы"]
  },
  { name: "Советы", subCategories: ["Советы", "Стилизация"] },
  { name: "Покупки по миру" },
  { name: "Покупки по РФ" },
  { name: "Конкурс" },
  { name: "Гайды и чек-листы", hidden: true, subCategories: ["Новогодние образы"] },
  { name: "Эфиры", hidden: true },
  {
    name: "Мастер-классы",
    hidden: true,
    subCategories: [
      "Какие головные уборы можно добавлять в свои образы",
      "Как продолжать носить вещи, которые вы купили для праздников",
      "«Я верю себе:внутренние опоры как источник женской силы»"
    ]
  },
  { name: "Бренды" }
];

function normalizeList(raw: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/\r?\n|,/g)) {
    const v = part.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function ensureHashtag(raw: string, tag: string) {
  const t = tag.startsWith("#") ? tag : `#${tag}`;
  const parts = (raw || "")
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.some((p) => p.toLowerCase() === t.toLowerCase())) return parts.join(" ");
  return [...parts, t].join(" ").trim();
}

function removeHashtag(raw: string, tag: string) {
  const t = tag.startsWith("#") ? tag : `#${tag}`;
  const parts = (raw || "")
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => p.toLowerCase() !== t.toLowerCase());
  return parts.join(" ").trim();
}

function hasHashtag(raw: string, tag: string) {
  const t = tag.startsWith("#") ? tag : `#${tag}`;
  const parts = (raw || "")
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.some((p) => p.toLowerCase() === t.toLowerCase());
}

function hashtagToUi(raw: string) {
  return (raw || "")
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#+/, ""))
    .join(" ");
}

function hashtagFromUi(raw: string) {
  const parts = (raw || "")
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  return parts.join(" ").trim();
}

function parseTelegramPostInput(raw: string) {
  const input = (raw || "").trim();
  if (!input) return null;
  if (/^\d+$/.test(input)) {
    const id = input;
    return { id, link: `https://t.me/c/2055411531/${id}` };
  }
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1] || "";
      const id = /^\d+$/.test(last) ? last : "";
      return { id: id || null, link: input };
    } catch {
      return null;
    }
  }
  const m = input.match(/(?:^|\/)(\d+)(?:$|[?#])/);
  if (m?.[1]) {
    const id = m[1];
    return { id, link: `https://t.me/c/2055411531/${id}` };
  }
  return null;
}

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState("h1");
  const [adminPass, setAdminPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [section, setSection] = useState<"materials" | "bottomNav">("materials");
  const [materialsView, setMaterialsView] = useState<"hub" | "list">("hub");
  const [activeHubCategory, setActiveHubCategory] = useState<string | null>(null);

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MaterialItem | null>(null);

  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>(DEFAULT_QUICK_FILTERS);
  const [quickFiltersOpen, setQuickFiltersOpen] = useState(false);
  const [quickFiltersDraft, setQuickFiltersDraft] = useState<QuickFilter[]>(DEFAULT_QUICK_FILTERS);

  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoriesDraft, setCategoriesDraft] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);

  const [feedAddOpen, setFeedAddOpen] = useState(false);
  const [feedAddInput, setFeedAddInput] = useState("");
  const [telegramSync, setTelegramSync] = useState<TelegramSyncStatus | null>(null);

  const defaultBottomNav = useMemo<BottomNavConfig>(() => {
    return {
      items: [
        { href: "/", label: "Главная", icon: "home" },
        { href: "/community", label: "О клубе", icon: "users" },
        { href: "/library", label: "Избранное", icon: "heart" }
      ],
      innerClassName:
        "bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(236,72,153,0.15)] px-6 py-3 flex justify-between items-center border border-pink-100/50 relative overflow-hidden ring-1 ring-pink-50"
    };
  }, []);

  const [bottomNavDraft, setBottomNavDraft] = useState<BottomNavConfig>(defaultBottomNav);

  const headers = useMemo(() => {
    return {
      "x-admin-user": adminUser,
      "x-admin-pass": adminPass
    };
  }, [adminUser, adminPass]);

  const loadMaterials = useCallback(async () => {
    setStatus(null);
    const res = await fetch(`/api/materials?t=${Date.now()}`, { cache: "no-store" });
    const data = await readJson<unknown>(res);
    if (!res.ok) {
      const message =
        pickStringField(data, "error") ||
        `Не удалось загрузить материалы (${res.status})`;
      throw new Error(message);
    }
    if (!Array.isArray(data)) {
      throw new Error("Неверный формат данных /api/materials");
    }
    setMaterials(data as MaterialItem[]);
  }, []);

  const loadBottomNav = useCallback(async () => {
    const res = await fetch(`/api/materials?key=bottomNav&t=${Date.now()}`, { cache: "no-store" });
    const data = await readJson<unknown>(res);
    if (!res.ok) return;
    if (!data || typeof data !== "object") return;
    const record = data as Record<string, unknown>;
    const items = record.items;
    const innerClassName = record.innerClassName;
    if (!Array.isArray(items)) return;
    const cleaned: BottomNavItem[] = items
      .map((it) => it as Partial<BottomNavItem>)
      .filter(
        (it): it is BottomNavItem =>
          Boolean(it) &&
          typeof it.href === "string" &&
          typeof it.label === "string" &&
          (it.icon === "home" || it.icon === "users" || it.icon === "heart")
      );
    const inner =
      typeof innerClassName === "string" && innerClassName.trim()
        ? innerClassName
        : defaultBottomNav.innerClassName;
    if (cleaned.length === 0) return;
    setBottomNavDraft({ items: cleaned, innerClassName: inner });
  }, [defaultBottomNav.innerClassName]);

  const loadQuickFilters = useCallback(async () => {
    const res = await fetch(`/api/materials?key=quickFilters&t=${Date.now()}`, { cache: "no-store" });
    const data = await readJson<unknown>(res);
    if (!res.ok) return;
    if (!Array.isArray(data)) return;
    const cleaned = data
      .map((it) => it as Partial<QuickFilter>)
      .filter(
        (it): it is QuickFilter =>
          Boolean(it) &&
          typeof it.label === "string" &&
          typeof it.category === "string" &&
          it.label.trim().length > 0 &&
          it.category.trim().length > 0
      );
    if (!cleaned.length) return;
    setQuickFilters(cleaned);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await fetch(`/api/materials?key=categories&t=${Date.now()}`, { cache: "no-store" });
    const data = await readJson<unknown>(res);
    if (!res.ok) return;
    if (!Array.isArray(data)) return;
    const cleaned = data
      .map((it) => it as Partial<CategoryConfig>)
      .map((it) => {
        const name = typeof it.name === "string" ? it.name.trim() : "";
        const hidden = Boolean(it.hidden);
        const subCategories = Array.isArray(it.subCategories)
          ? it.subCategories
              .map((s) => (typeof s === "string" ? s.trim() : ""))
              .filter((s) => s.length > 0)
          : undefined;
        return {
          name,
          hidden,
          subCategories: subCategories && subCategories.length ? subCategories : undefined
        } satisfies CategoryConfig;
      })
      .filter((it) => it.name.length > 0);
    if (!cleaned.length) return;
    setCategories(cleaned);
  }, []);

  const loadTelegramSync = useCallback(async () => {
    const res = await fetch(`/api/materials?key=telegram_last_sync&t=${Date.now()}`, { cache: "no-store" });
    const data = await readJson<unknown>(res);
    if (!res.ok) return;
    if (!data || typeof data !== "object") return;
    const record = data as Record<string, unknown>;
    const ok = typeof record.ok === "boolean" ? record.ok : undefined;
    const at = typeof record.at === "number" ? record.at : Number(record.at || 0);
    const added = typeof record.added === "number" ? record.added : Number(record.added || 0);
    const updates = typeof record.updates === "number" ? record.updates : Number(record.updates || 0);
    const error = typeof record.error === "string" ? record.error : undefined;
    setTelegramSync({
      ok,
      at: Number.isFinite(at) && at > 0 ? at : undefined,
      added: Number.isFinite(added) ? added : undefined,
      updates: Number.isFinite(updates) ? updates : undefined,
      error
    });
  }, []);

  const diagnoseTelegramSync = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/telegram?health=1&t=${Date.now()}`, {
        method: "POST",
        headers,
        cache: "no-store"
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось проверить (${res.status})`;
        throw new Error(message);
      }
      if (!data || typeof data !== "object") {
        throw new Error("Неверный ответ health");
      }
      const record = data as Record<string, unknown>;
      const tokenPresent = Boolean(record.tokenPresent);
      const supabasePresent = Boolean(record.supabasePresent);
      const supabaseAccessible = record.supabaseAccessible !== false;
      const supabaseError = typeof record.supabaseError === "string" ? record.supabaseError.trim() : "";
      const supabaseKeyFormat =
        typeof record.supabaseKeyFormat === "string" ? record.supabaseKeyFormat.trim() : "";
      const supabaseKeyEnv =
        typeof record.supabaseKeyEnv === "string" ? record.supabaseKeyEnv.trim() : "";
      const chatId = typeof record.chatId === "number" ? record.chatId : Number(record.chatId || 0);
      const chatTitle = typeof record.chatTitle === "string" ? record.chatTitle.trim() : "";
      const chatType = typeof record.chatType === "string" ? record.chatType.trim() : "";
      const webhookUrl = typeof record.webhookUrl === "string" ? record.webhookUrl.trim() : "";
      const webhookPending =
        typeof record.webhookPendingUpdateCount === "number"
          ? record.webhookPendingUpdateCount
          : Number(record.webhookPendingUpdateCount || 0);
      const webhookLastError =
        typeof record.webhookLastErrorMessage === "string" ? record.webhookLastErrorMessage.trim() : "";
      const memberStatus = typeof record.memberStatus === "string" ? record.memberStatus.trim() : "";
      const botUsername = typeof record.botUsername === "string" ? record.botUsername.trim() : "";
      const lastUpdateId =
        typeof record.telegram_last_update_id_num === "number"
          ? record.telegram_last_update_id_num
          : Number(record.telegram_last_update_id || 0);
      const pendingCount =
        typeof record.pendingUpdatesCount === "number"
          ? record.pendingUpdatesCount
          : Number(record.pendingUpdatesCount || 0);
      const pendingTarget =
        typeof record.pendingTargetCount === "number"
          ? record.pendingTargetCount
          : Number(record.pendingTargetCount || 0);
      const pendingErrorRaw =
        typeof record.pendingUpdatesError === "string" ? record.pendingUpdatesError.trim() : "";
      const pendingError =
        webhookUrl && /409 Conflict/i.test(pendingErrorRaw) ? "" : pendingErrorRaw;
      const pendingAll =
        typeof record.pendingAllUpdatesCount === "number"
          ? record.pendingAllUpdatesCount
          : Number(record.pendingAllUpdatesCount || 0);
      const pendingAllTarget =
        typeof record.pendingAllTargetCount === "number"
          ? record.pendingAllTargetCount
          : Number(record.pendingAllTargetCount || 0);
      const pendingAllErrorRaw =
        typeof record.pendingAllUpdatesError === "string" ? record.pendingAllUpdatesError.trim() : "";
      const pendingAllError =
        webhookUrl && /409 Conflict/i.test(pendingAllErrorRaw) ? "" : pendingAllErrorRaw;
      const msg = `Диагностика: token=${tokenPresent ? "ok" : "нет"}, supabase=${
        supabasePresent ? (supabaseAccessible ? "ok" : "ошибка") : "нет"
      }${
        supabasePresent && supabaseKeyFormat ? `, key=${supabaseKeyFormat}` : ""
      }${
        supabasePresent && supabaseKeyEnv ? `, keyEnv=${supabaseKeyEnv}` : ""
      }, chatId=${Number.isFinite(chatId) && chatId ? chatId : "?"}${
        chatTitle ? `, чат="${chatTitle}"` : ""
      }${chatType ? `, type=${chatType}` : ""}${
        botUsername ? `, bot=@${botUsername}` : ""
      }${
        memberStatus ? `, роль=${memberStatus}` : ""
      }${
        webhookUrl ? `, webhook=есть` : ""
      }${
        webhookUrl && Number.isFinite(webhookPending) ? `, webhookPending=${webhookPending}` : ""
      }${
        webhookUrl && webhookLastError ? `, webhookErr=${webhookLastError}` : ""
      }${
        supabasePresent && !supabaseAccessible && supabaseError ? `, supabaseErr=${supabaseError}` : ""
      }${
        Number.isFinite(lastUpdateId) && lastUpdateId > 0 ? `, offset=${lastUpdateId}` : ""
      }${
        Number.isFinite(pendingCount) ? `, pending=${pendingCount}` : ""
      }${
        Number.isFinite(pendingTarget) ? `, pendingTarget=${pendingTarget}` : ""
      }${
        Number.isFinite(pendingAll) ? `, pendingAll=${pendingAll}` : ""
      }${
        Number.isFinite(pendingAllTarget) ? `, pendingAllTarget=${pendingAllTarget}` : ""
      }${pendingError ? `, pendingErr=${pendingError}` : ""}${
        pendingAllError ? `, pendingAllErr=${pendingAllError}` : ""
      }`;
      await loadTelegramSync();
      setStatus(msg);
    } finally {
      setBusy(false);
    }
  }, [headers, loadTelegramSync]);

  const resetTelegramOffset = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/telegram?reset=1&t=${Date.now()}`, {
        method: "POST",
        headers,
        cache: "no-store"
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось сбросить (${res.status})`;
        throw new Error(message);
      }
      await loadTelegramSync();
      setStatus("Offset сброшен. Нажми «Обновить»");
    } finally {
      setBusy(false);
    }
  }, [headers, loadTelegramSync]);

  const importTelegramSeed = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/telegram?seed=200&forceSeed=1&t=${Date.now()}`, {
        method: "POST",
        headers,
        cache: "no-store"
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось импортировать (${res.status})`;
        throw new Error(message);
      }
      const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      const seeded = typeof record.seeded === "number" ? record.seeded : Number(record.seeded || 0);
      await loadMaterials();
      await loadTelegramSync();
      setStatus(`Импорт из файла: +${Number.isFinite(seeded) ? seeded : 0}`);
    } finally {
      setBusy(false);
    }
  }, [headers, loadMaterials, loadTelegramSync]);

  const restoreTelegramMaterials = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/telegram?restore=1&t=${Date.now()}`, {
        method: "POST",
        headers,
        cache: "no-store"
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось восстановить (${res.status})`;
        throw new Error(message);
      }
      const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      const total = typeof record.total === "number" ? record.total : Number(record.total || 0);
      const keptNew = typeof record.keptNew === "number" ? record.keptNew : Number(record.keptNew || 0);
      await loadMaterials();
      await loadTelegramSync();
      setStatus(`Восстановлено. Всего: ${Number.isFinite(total) ? total : 0}, новых с 6 февраля: ${Number.isFinite(keptNew) ? keptNew : 0}`);
    } finally {
      setBusy(false);
    }
  }, [headers, loadMaterials, loadTelegramSync]);

  const enableTelegramWebhook = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/telegram?setWebhook=1&t=${Date.now()}`, {
        method: "POST",
        headers,
        cache: "no-store"
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось включить webhook (${res.status})`;
        throw new Error(message);
      }
      await loadTelegramSync();
      setStatus("Webhook включен. Новые посты будут приходить сами");
    } finally {
      setBusy(false);
    }
  }, [headers, loadTelegramSync]);

  const disableTelegramWebhook = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/telegram?deleteWebhook=1&t=${Date.now()}`, {
        method: "POST",
        headers,
        cache: "no-store"
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось выключить webhook (${res.status})`;
        throw new Error(message);
      }
      await loadTelegramSync();
      setStatus("Webhook выключен");
    } finally {
      setBusy(false);
    }
  }, [headers, loadTelegramSync]);

  const syncTelegram = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/sync/telegram?t=${Date.now()}`, {
        method: "POST",
        headers,
        cache: "no-store"
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось синхронизировать (${res.status})`;
        throw new Error(message);
      }
      const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
      const added = typeof record.added === "number" ? record.added : Number(record.added || 0);
      const updates = typeof record.updates === "number" ? record.updates : Number(record.updates || 0);
      const msg = `Синхронизация Telegram: +${Number.isFinite(added) ? added : 0}, обновлений: ${
        Number.isFinite(updates) ? updates : 0
      }`;
      await loadMaterials();
      await loadTelegramSync();
      setStatus(msg);
    } finally {
      setBusy(false);
    }
  }, [headers, loadMaterials, loadTelegramSync]);

  useEffect(() => {
    if (!authed) return;
    loadMaterials().catch((e: unknown) => {
      setStatus(e instanceof Error ? e.message : "Ошибка загрузки");
    });
    loadBottomNav().catch(() => {});
    loadQuickFilters().catch(() => {});
    loadCategories().catch(() => {});
    loadTelegramSync().catch(() => {});
  }, [authed, loadBottomNav, loadCategories, loadMaterials, loadQuickFilters, loadTelegramSync]);

  const baseList = useMemo(() => {
    if (section !== "materials") return materials;
    if (materialsView !== "list") return materials;
    if (!activeHubCategory) return materials;
    const query = activeHubCategory.toLowerCase().replace(/\s/g, "");
    return materials.filter((m) => {
      const h = (m.hashtag || "").toLowerCase();
      const link = typeof m.link === "string" ? m.link.toLowerCase() : "";
      if (activeHubCategory === "Лента новостей") return h.includes("#вленту");
      if (activeHubCategory === "Бренды") return h.includes("#обзорыбрендов");
      if (activeHubCategory === "Мастер-классы")
        return h.includes("#мастеркласс") || h.includes("#мастер-класс");
      if (activeHubCategory === "Эфиры") return h.includes("#эфир");
      if (activeHubCategory === "Советы")
        return h.includes("#советы") || h.includes("#стилизация");
      if (activeHubCategory === "Мои обучения")
        return m.id.startsWith("edu_") || h.includes("#обучение");
      if (activeHubCategory === "Гайды и чек-листы")
        return h.includes("#гайд") || link.endsWith(".pdf");
      if (activeHubCategory === "Идеи образов") {
        const ok =
          h.includes("#идеиобразов") ||
          h.includes("#образ") ||
          h.includes("#образы") ||
          h.includes("#lookднялена");
        if (!ok) return false;
        if (m.id === "15199" || m.link === "https://t.me/c/2055411531/15199") return false;
        if (link.endsWith(".pdf")) return false;
        return true;
      }
      return h.includes(query) || h.includes("#" + query);
    });
  }, [activeHubCategory, materials, materialsView, section]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((m) => {
      const hay = `${m.id} ${m.title} ${m.hashtag} ${m.link}`.toLowerCase();
      return hay.includes(q);
    });
  }, [baseList, filter]);

  const selectItem = useCallback(
    (id: string) => {
      const item = materials.find((m) => m.id === id) || null;
      setSelectedId(id);
      setDraft(item ? JSON.parse(JSON.stringify(item)) : null);
      setStatus(null);
    },
    [materials]
  );

  const ensureDraft = useCallback(() => {
    if (!draft) throw new Error("Сначала выбери материал");
    return draft;
  }, [draft]);

  const upsertDraft = useCallback(() => {
    if (!draft) return;
    setMaterials((prev) => {
      const idx = prev.findIndex((m) => m.id === draft.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = draft;
        return copy;
      }
      return [draft, ...prev];
    });
  }, [draft]);

  const applyDraftToList = useCallback(
    (list: MaterialItem[]) => {
      if (!draft) return list;
      const idx = list.findIndex((m) => m.id === draft.id);
      if (idx >= 0) {
        const copy = [...list];
        copy[idx] = draft;
        return copy;
      }
      return [draft, ...list];
    },
    [draft]
  );

  const removeItem = useCallback(() => {
    const current = ensureDraft();
    setMaterials((prev) => prev.filter((m) => m.id !== current.id));
    setSelectedId(null);
    setDraft(null);
  }, [ensureDraft]);

  const addNew = useCallback(() => {
    const id = `custom_${Date.now()}`;
    const next: MaterialItem = {
      id,
      title: "Новый материал",
      hashtag: "#новинка",
      image: "/ban.png",
      images: [],
      link: "https://t.me/c/2055411531/1",
      description: "",
      video_link: "",
      date: Math.floor(Date.now() / 1000)
    };
    setDraft(next);
    setSelectedId(id);
    setStatus(null);
  }, []);

  const addToNews = useCallback(() => {
    const id = `custom_${Date.now()}`;
    const next: MaterialItem = {
      id,
      title: "Новость",
      hashtag: "#вленту",
      image: "/ban.png",
      images: [],
      link: "",
      description: "",
      video_link: "",
      date: Math.floor(Date.now() / 1000)
    };
    setDraft(next);
    setSelectedId(id);
    setStatus(null);
    setSection("materials");
    setMaterialsView("list");
    setActiveHubCategory("Лента новостей");
    setFilter("");
  }, []);

  const openFeedAdd = useCallback(
    (prefill?: string) => {
      setFeedAddInput((prefill || "").trim());
      setFeedAddOpen(true);
    },
    []
  );

  const addPostToFeed = useCallback(() => {
    const parsed = parseTelegramPostInput(feedAddInput);
    if (!parsed) {
      setStatus("Вставь ссылку на пост или его id");
      return;
    }

    const id = (parsed.id || "").trim();
    const link = (parsed.link || "").trim();

    const found =
      (id ? materials.find((m) => m.id === id) : null) ||
      (link ? materials.find((m) => (m.link || "").trim() === link) : null) ||
      (id ? materials.find((m) => typeof m.link === "string" && m.link.includes(`/${id}`)) : null) ||
      null;

    const now = Math.floor(Date.now() / 1000);
    if (found) {
      const updated: MaterialItem = {
        ...found,
        hashtag: ensureHashtag(found.hashtag || "", "#вленту"),
        date: found.date ?? now
      };
      setDraft(updated);
      setSelectedId(updated.id);
    } else {
      const next: MaterialItem = {
        id: id || `custom_${Date.now()}`,
        title: "Новость",
        hashtag: "#вленту",
        image: "/ban.png",
        images: [],
        link: link || "",
        description: "",
        video_link: "",
        date: now
      };
      setDraft(next);
      setSelectedId(next.id);
    }

    setFeedAddOpen(false);
    setSection("materials");
    setMaterialsView("list");
    setActiveHubCategory("Лента новостей");
    setFilter("");
    setStatus(null);
  }, [feedAddInput, materials]);

  const openHubCategory = useCallback((category: string) => {
    setSection("materials");
    setMaterialsView("list");
    setActiveHubCategory(category);
    setFilter("");
    setDraft(null);
    setSelectedId(null);
  }, []);

  const backToHub = useCallback(() => {
    setMaterialsView("hub");
    setActiveHubCategory(null);
    setFilter("");
    setDraft(null);
    setSelectedId(null);
  }, []);

  const saveAll = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const toSave = applyDraftToList(materials);
      setMaterials(toSave);
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(toSave)
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось сохранить (${res.status})`;
        throw new Error(message);
      }
      setStatus("Сохранено");
      await loadMaterials();
    } finally {
      setBusy(false);
    }
  }, [applyDraftToList, headers, loadMaterials, materials]);

  const saveBottomNav = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/materials?key=bottomNav", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(bottomNavDraft)
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось сохранить (${res.status})`;
        throw new Error(message);
      }
      setStatus("Сохранено");
      await loadBottomNav();
    } finally {
      setBusy(false);
    }
  }, [bottomNavDraft, headers, loadBottomNav]);

  const saveQuickFilters = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/materials?key=quickFilters", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(quickFiltersDraft)
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось сохранить (${res.status})`;
        throw new Error(message);
      }
      setQuickFilters(quickFiltersDraft);
      setQuickFiltersOpen(false);
      setStatus("Сохранено");
    } finally {
      setBusy(false);
    }
  }, [headers, quickFiltersDraft]);

  const saveCategories = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const cleaned = categoriesDraft
        .map((it) => {
          const name = (it.name || "").trim();
          const hidden = Boolean(it.hidden);
          const subCategories = Array.isArray(it.subCategories)
            ? it.subCategories.map((s) => (s || "").trim()).filter(Boolean)
            : undefined;
          return {
            name,
            hidden,
            subCategories: subCategories && subCategories.length ? subCategories : undefined
          } satisfies CategoryConfig;
        })
        .filter((it) => it.name.length > 0);
      const res = await fetch("/api/materials?key=categories", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(cleaned)
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось сохранить (${res.status})`;
        throw new Error(message);
      }
      setCategories(cleaned.length ? cleaned : DEFAULT_CATEGORIES);
      setCategoriesOpen(false);
      setStatus("Сохранено");
    } finally {
      setBusy(false);
    }
  }, [categoriesDraft, headers]);

  const login = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/ping", { headers, cache: "no-store" });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        setAuthed(false);
        const message =
          pickStringField(data, "error") || "Неверный логин или пароль";
        setStatus(message);
        return;
      }
      setAuthed(true);
      setMaterialsView("hub");
      setActiveHubCategory(null);
      setFilter("");
    } catch (e: unknown) {
      setAuthed(false);
      setStatus(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }, [headers]);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData
      });
      const data = await readJson<unknown>(res);
      if (!res.ok) {
        const message =
          pickStringField(data, "error") || `Не удалось загрузить файл (${res.status})`;
        throw new Error(message);
      }
      const url = pickStringField(data, "url");
      if (!url) throw new Error("Сервер не вернул url");
      return url;
    },
    [headers]
  );

  return (
    <div className="min-h-screen pb-24 font-sans bg-gray-50/50 relative">
      <div className="relative z-10 w-full min-h-screen">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pt-12 pb-4 px-4 lg:px-10 2xl:px-16 shadow-sm">
          <div className="flex items-center gap-2">
            <Link
              href="/community"
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-wide text-gray-900">
              Админ
            </h1>
            {authed ? (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() =>
                    (section === "bottomNav" ? saveBottomNav() : saveAll()).catch((e: unknown) =>
                      setStatus(e instanceof Error ? e.message : "Ошибка")
                    )
                  }
                  disabled={busy}
                  className="bg-pink-500 text-white font-bold px-4 py-2 rounded-2xl shadow-lg shadow-pink-200 hover:bg-pink-600 transition-colors disabled:opacity-60 text-xs"
                >
                  Сохранить
                </button>
              </div>
            ) : null}
          </div>

          {!authed ? (
            <div className="mt-6 bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
              <div className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Логин
                  </span>
                  <input
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    placeholder="h1"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Пароль
                  </span>
                  <input
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    placeholder="Пароль"
                  />
                </label>
                <button
                  onClick={() => login()}
                  disabled={busy}
                  className="mt-2 w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors text-sm"
                >
                  Войти
                </button>
                {status ? (
                  <div className="text-sm text-gray-600">{status}</div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setSection("materials")}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                    section === "materials"
                      ? "bg-white text-pink-500 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Материалы
                </button>
                <button
                  onClick={() => setSection("bottomNav")}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                    section === "bottomNav"
                      ? "bg-white text-pink-500 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  Навбар
                </button>
              </div>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-white px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200 shadow-sm"
                  placeholder="Поиск по id/названию/хэштегу/ссылке"
                  disabled={section !== "materials" || materialsView !== "list"}
                />
              </div>
              {status ? (
                <div className="mt-3 text-sm text-gray-600">{status}</div>
              ) : null}
            </div>
          )}
        </div>

        {authed && section === "materials" ? (
          <div className="px-4 lg:px-10 2xl:px-16 mt-6">
            {materialsView === "hub" ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[...DEFAULT_MENU_ITEMS, { title: "ЛЕНТА НОВОСТЕЙ", image: "/новое.jpg", category: "Лента новостей" }].map(
                    (item) => (
                      <button
                        key={item.category}
                        onClick={() => openHubCategory(item.category)}
                        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group active:scale-[0.98] transition-transform bg-gray-200"
                      >
                        <SafeImage src={item.image} alt={item.title} fill className="object-cover" />
                      </button>
                    )
                  )}
                </div>

                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-lg font-black text-gray-900">Быстрые категории</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          syncTelegram().catch((e: unknown) =>
                            setStatus(e instanceof Error ? e.message : "Ошибка")
                          )
                        }
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                        disabled={busy}
                      >
                        Обновить
                      </button>
                      <button
                        onClick={() =>
                          enableTelegramWebhook().catch((e: unknown) =>
                            setStatus(e instanceof Error ? e.message : "Ошибка")
                          )
                        }
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                        disabled={busy}
                      >
                        Webhook
                      </button>
                      <button
                        onClick={() =>
                          disableTelegramWebhook().catch((e: unknown) =>
                            setStatus(e instanceof Error ? e.message : "Ошибка")
                          )
                        }
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                        disabled={busy}
                      >
                        Webhook off
                      </button>
                      <button
                        onClick={() =>
                          diagnoseTelegramSync().catch((e: unknown) =>
                            setStatus(e instanceof Error ? e.message : "Ошибка")
                          )
                        }
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                        disabled={busy}
                      >
                        Проверить
                      </button>
                      <button
                        onClick={() =>
                          resetTelegramOffset().catch((e: unknown) =>
                            setStatus(e instanceof Error ? e.message : "Ошибка")
                          )
                        }
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                        disabled={busy}
                      >
                        Сбросить
                      </button>
                      <button
                        onClick={() =>
                          importTelegramSeed().catch((e: unknown) =>
                            setStatus(e instanceof Error ? e.message : "Ошибка")
                          )
                        }
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                        disabled={busy}
                      >
                        Импорт
                      </button>
                      <button
                        onClick={() =>
                          restoreTelegramMaterials().catch((e: unknown) =>
                            setStatus(e instanceof Error ? e.message : "Ошибка")
                          )
                        }
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                        disabled={busy}
                      >
                        Восстановить
                      </button>
                      <button
                        onClick={() => {
                          setQuickFiltersDraft(quickFilters);
                          setQuickFiltersOpen(true);
                        }}
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => openFeedAdd()}
                        className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                      >
                        В ленту
                      </button>
                    </div>
                  </div>
                  {telegramSync ? (
                    <div className="text-xs text-gray-500 mb-3">
                      {telegramSync.ok === false
                        ? `Telegram sync: ошибка${telegramSync.at ? ` (${new Date(telegramSync.at).toLocaleString("ru-RU")})` : ""}${telegramSync.error ? ` — ${telegramSync.error}` : ""}`
                        : `Telegram sync: ${telegramSync.at ? new Date(telegramSync.at).toLocaleString("ru-RU") : "—"}${typeof telegramSync.added === "number" ? `, +${telegramSync.added}` : ""}${
                            typeof telegramSync.updates === "number" ? `, обновлений: ${telegramSync.updates}` : ""
                          }`}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((qf, idx) => (
                      <button
                        key={`${qf.label}-${idx}`}
                        onClick={() => {
                          const raw = qf.category.trim();
                          if (raw.toUpperCase().startsWith("LINK:")) {
                            const url = raw.slice("LINK:".length).trim();
                            if (url) window.open(url, "_blank", "noopener,noreferrer");
                            return;
                          }
                          openHubCategory(raw);
                        }}
                        className="rounded-full bg-pink-50 text-pink-600 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-pink-100 transition-colors"
                      >
                        {qf.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h2 className="text-lg font-black text-gray-900">Категории и подразделы</h2>
                    <button
                      onClick={() => {
                        setCategoriesDraft(categories.length ? categories : DEFAULT_CATEGORIES);
                        setCategoriesOpen(true);
                      }}
                      className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                    >
                      Изменить
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {categories.length} категорий
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center justify-between gap-3">
                  <button
                    onClick={backToHub}
                    className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                  >
                    ← К плиткам
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        syncTelegram().catch((e: unknown) =>
                          setStatus(e instanceof Error ? e.message : "Ошибка")
                        )
                      }
                      className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs disabled:opacity-60"
                      disabled={busy}
                    >
                      Обновить
                    </button>
                    <button
                      onClick={() => openFeedAdd(selectedId || "")}
                      className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                    >
                      В ленту
                    </button>
                    <button
                      onClick={addNew}
                      className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                    >
                      + Добавить
                    </button>
                  </div>
                </div>

                {filtered.map((m) => {
                  const badge =
                    m.hashtag?.split(" ").map((t) => t.trim()).filter(Boolean)[0] ||
                    "#материал";
                  const badgeUi = hashtagToUi(badge) || "материал";
                  const isSelected = selectedId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`bg-white rounded-[2rem] p-4 shadow-sm border flex gap-4 items-center group relative overflow-hidden cursor-pointer transition-colors ${
                        isSelected
                          ? "border-pink-300 ring-2 ring-pink-100"
                          : "border-gray-100 hover:border-pink-200"
                      }`}
                      onClick={() => selectItem(m.id)}
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gray-200 shrink-0 overflow-hidden relative">
                        <SafeImage
                          src={m.image || "/ban.png"}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {badgeUi}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                          {m.title}
                        </h3>
                        <div className="text-xs text-gray-400 font-medium">id: {m.id}</div>
                      </div>
                    </div>
                  );
                })}
                {!filtered.length ? (
                  <div className="text-center text-gray-400 py-8 md:col-span-2">
                    Ничего не найдено
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        {authed && section === "bottomNav" ? (
          <div className="px-4 lg:px-10 2xl:px-16 mt-6 grid gap-4">
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-gray-900">Нижняя навигация</h2>
                <button
                  onClick={() =>
                    setBottomNavDraft((prev) => ({
                      ...prev,
                      items: [...prev.items, { href: "/", label: "Новый", icon: "home" }]
                    }))
                  }
                  className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                >
                  + Пункт
                </button>
              </div>

              <div className="grid gap-3">
                {bottomNavDraft.items.map((it, idx) => (
                  <div
                    key={`${it.href}-${idx}`}
                    className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
                  >
                    <label className="grid gap-1 md:col-span-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Текст
                      </span>
                      <input
                        value={it.label}
                        onChange={(e) =>
                          setBottomNavDraft((prev) => {
                            const items = [...prev.items];
                            items[idx] = { ...items[idx], label: e.target.value };
                            return { ...prev, items };
                          })
                        }
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                      />
                    </label>

                    <label className="grid gap-1 md:col-span-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Ссылка
                      </span>
                      <input
                        value={it.href}
                        onChange={(e) =>
                          setBottomNavDraft((prev) => {
                            const items = [...prev.items];
                            items[idx] = { ...items[idx], href: e.target.value };
                            return { ...prev, items };
                          })
                        }
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                      />
                    </label>

                    <div className="flex gap-2">
                      <label className="grid gap-1 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Иконка
                        </span>
                        <select
                          value={it.icon}
                          onChange={(e) =>
                            setBottomNavDraft((prev) => {
                              const items = [...prev.items];
                              items[idx] = {
                                ...items[idx],
                                icon: e.target.value as BottomNavItem["icon"]
                              };
                              return { ...prev, items };
                            })
                          }
                          className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        >
                          <option value="home">Главная</option>
                          <option value="users">О клубе</option>
                          <option value="heart">Избранное</option>
                        </select>
                      </label>
                      <button
                        onClick={() =>
                          setBottomNavDraft((prev) => {
                            const items = [...prev.items];
                            items.splice(idx, 1);
                            return { ...prev, items };
                          })
                        }
                        className="rounded-2xl bg-white px-4 py-3 text-xs font-bold text-gray-700 border border-gray-100 hover:bg-gray-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <label className="grid gap-1 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    ClassName для div (контейнер кнопок)
                  </span>
                  <textarea
                    value={bottomNavDraft.innerClassName}
                    onChange={(e) =>
                      setBottomNavDraft((prev) => ({ ...prev, innerClassName: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-[1.5rem] border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <BottomNav />

      {quickFiltersOpen ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setQuickFiltersOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setQuickFiltersOpen(false)}
              className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">Быстрые категории</h2>
                <button
                  onClick={() =>
                    setQuickFiltersDraft((prev) => [...prev, { label: "новая", category: "Категория" }])
                  }
                  className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                >
                  + Категория
                </button>
              </div>

              <div className="grid gap-3">
                {quickFiltersDraft.map((qf, idx) => (
                  <div key={`${qf.label}-${qf.category}-${idx}`} className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={qf.label}
                        onChange={(e) =>
                          setQuickFiltersDraft((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], label: e.target.value };
                            return next;
                          })
                        }
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder="Текст кнопки"
                      />
                      <input
                        value={qf.category}
                        onChange={(e) =>
                          setQuickFiltersDraft((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], category: e.target.value };
                            return next;
                          })
                        }
                        className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder="Категория или LINK:https://..."
                      />
                    </div>
                    <button
                      onClick={() =>
                        setQuickFiltersDraft((prev) => {
                          const next = [...prev];
                          next.splice(idx, 1);
                          return next;
                        })
                      }
                      className="w-full rounded-2xl bg-white px-4 py-3 text-xs font-bold text-gray-700 border border-gray-100 hover:bg-gray-50"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 mt-6">
                <button
                  onClick={() => saveQuickFilters().catch((e: unknown) =>
                    setStatus(e instanceof Error ? e.message : "Ошибка")
                  )}
                  className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors text-sm disabled:opacity-60"
                  disabled={busy}
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setQuickFiltersOpen(false)}
                  className="w-full bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm"
                  disabled={busy}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {categoriesOpen ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setCategoriesOpen(false)}
          />
          <div className="relative w-full max-w-4xl md:max-h-[90vh] overflow-y-auto bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setCategoriesOpen(false)}
              className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-black text-gray-900">Категории и подразделы</h2>
                <button
                  onClick={() =>
                    setCategoriesDraft((prev) => [...prev, { name: "Новая категория", subCategories: [] }])
                  }
                  className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                >
                  + Категория
                </button>
              </div>

              <div className="grid gap-4">
                {categoriesDraft.map((cat, idx) => (
                  <div key={`${cat.name}-${idx}`} className="rounded-[1.5rem] border border-gray-100 bg-gray-50/30 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        value={cat.name}
                        onChange={(e) =>
                          setCategoriesDraft((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], name: e.target.value };
                            return next;
                          })
                        }
                        className="flex-1 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder="Название категории"
                      />
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <input
                          type="checkbox"
                          checked={Boolean(cat.hidden)}
                          onChange={(e) =>
                            setCategoriesDraft((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], hidden: e.target.checked };
                              return next;
                            })
                          }
                          className="h-4 w-4 accent-pink-500"
                        />
                        скрыть
                      </label>
                      <button
                        onClick={() =>
                          setCategoriesDraft((prev) => {
                            const next = [...prev];
                            next.splice(idx, 1);
                            return next;
                          })
                        }
                        className="rounded-2xl bg-white px-4 py-3 text-xs font-bold text-gray-700 border border-gray-100 hover:bg-gray-50"
                      >
                        ✕
                      </button>
                    </div>

                    <label className="grid gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Подразделы (по строкам или через запятую)
                      </span>
                      <textarea
                        value={(cat.subCategories || []).join("\n")}
                        onChange={(e) =>
                          setCategoriesDraft((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], subCategories: normalizeList(e.target.value) };
                            return next;
                          })
                        }
                        rows={Math.min(10, Math.max(3, (cat.subCategories || []).length || 3))}
                        className="w-full rounded-[1.5rem] border border-gray-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                        placeholder={"Груша\nЯблоко\nПесочные часы"}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 mt-6">
                <button
                  onClick={() =>
                    saveCategories().catch((e: unknown) =>
                      setStatus(e instanceof Error ? e.message : "Ошибка")
                    )
                  }
                  className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors text-sm disabled:opacity-60"
                  disabled={busy}
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setCategoriesOpen(false)}
                  className="w-full bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm"
                  disabled={busy}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {feedAddOpen ? (
        <div className="fixed inset-0 z-[56] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setFeedAddOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setFeedAddOpen(false)}
              className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <h2 className="text-lg font-black text-gray-900 mb-2">Добавить пост в ленту</h2>
              <div className="text-sm text-gray-600 mb-4">
                Вставь ссылку на пост или его id (например 15178)
              </div>
              <input
                value={feedAddInput}
                onChange={(e) => setFeedAddInput(e.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="https://t.me/c/2055411531/15178"
              />

              <div className="grid gap-2 mt-6">
                <button
                  onClick={addPostToFeed}
                  className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors text-sm disabled:opacity-60"
                  disabled={busy}
                >
                  Добавить
                </button>
                <button
                  onClick={() => {
                    setFeedAddOpen(false);
                    addToNews();
                  }}
                  className="w-full bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
                  disabled={busy}
                >
                  Создать новость вручную
                </button>
                <button
                  onClick={() => setFeedAddOpen(false)}
                  className="w-full bg-white text-gray-700 font-bold py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
                  disabled={busy}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {draft && section === "materials" ? (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => {
              setDraft(null);
              setSelectedId(null);
            }}
          />
          <div className="relative w-full h-full bg-white overflow-y-auto animate-in fade-in duration-200">
            <button
              onClick={() => {
                setDraft(null);
                setSelectedId(null);
              }}
              className="fixed top-4 right-4 z-[70] bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative h-64 w-full bg-black">
              <SafeImage src={draft.image || "/ban.png"} alt={draft.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <label className="absolute bottom-4 left-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/20 text-white px-4 py-2 text-xs font-bold backdrop-blur-md border border-white/20 hover:bg-white/30 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    uploadFile(file)
                      .then((url) => setDraft((d) => (d ? { ...d, image: url } : d)))
                      .catch((err: unknown) =>
                        setStatus(err instanceof Error ? err.message : "Ошибка загрузки")
                      )
                      .finally(() => setBusy(false));
                  }}
                />
                {(draft.hashtag || "").toLowerCase().includes("#эфир")
                  ? "Загрузить обложку эфира"
                  : "Загрузить обложку"}
              </label>
            </div>

            <div className="p-6 pt-6">
              <div className="flex gap-2 mb-3">
                <span className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {hashtagToUi(draft.hashtag || "") || "материал"}
                </span>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Название
                  </span>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      ID
                    </span>
                    <input
                      value={draft.id}
                      onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Дата
                    </span>
                    <input
                      value={String(draft.date ?? "")}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const n = raw ? Number(raw) : NaN;
                        setDraft({ ...draft, date: Number.isFinite(n) ? n : undefined });
                      }}
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                      placeholder="1770051601"
                    />
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Категории
                  </span>
                  <input
                    value={hashtagToUi(draft.hashtag)}
                    onChange={(e) => setDraft({ ...draft, hashtag: hashtagFromUi(e.target.value) })}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    placeholder="новинка советы"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <input
                    type="checkbox"
                    checked={hasHashtag(draft.hashtag || "", "#вленту")}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? ensureHashtag(draft.hashtag || "", "#вленту")
                        : removeHashtag(draft.hashtag || "", "#вленту");
                      setDraft({ ...draft, hashtag: next });
                    }}
                    className="h-4 w-4 accent-pink-500"
                  />
                  В ленту
                </label>

                <label className="grid gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Ссылка
                  </span>
                  <input
                    value={draft.link}
                    onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Видео
                  </span>
                  <input
                    value={draft.video_link ?? ""}
                    onChange={(e) => setDraft({ ...draft, video_link: e.target.value })}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Описание
                  </span>
                  <textarea
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={4}
                    className="w-full rounded-[1.5rem] border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Доп. картинки
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-pink-50 text-pink-500 px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-pink-100 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setBusy(true);
                          uploadFile(file)
                            .then((url) =>
                              setDraft((d) => {
                                if (!d) return d;
                                const images = Array.isArray(d.images) ? d.images : [];
                                return { ...d, images: [...images, url] };
                              })
                            )
                            .catch((err: unknown) =>
                              setStatus(err instanceof Error ? err.message : "Ошибка загрузки")
                            )
                            .finally(() => setBusy(false));
                        }}
                      />
                      + Файл
                    </label>
                  </div>
                  {(draft.images || []).length ? (
                    <div className="grid gap-2">
                      {(draft.images || []).map((url, idx) => (
                        <div key={`${url}-${idx}`} className="flex items-center gap-2">
                          <input
                            value={url}
                            onChange={(e) => {
                              const next = [...(draft.images || [])];
                              next[idx] = e.target.value;
                              setDraft({ ...draft, images: next });
                            }}
                            className="flex-1 rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                          />
                          <button
                            onClick={() => {
                              const next = [...(draft.images || [])];
                              next.splice(idx, 1);
                              setDraft({ ...draft, images: next });
                            }}
                            className="rounded-2xl bg-white px-4 py-3 text-xs font-bold text-gray-700 border border-gray-100 hover:bg-gray-50"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Пусто</div>
                  )}
                </div>

                <div className="grid gap-2 mt-2">
                  <button
                    onClick={() => {
                      upsertDraft();
                      setStatus("Изменения применены. Нажми «Сохранить», чтобы записать в Supabase.");
                    }}
                    className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors text-sm disabled:opacity-60"
                    disabled={busy}
                  >
                    Применить
                  </button>
                  <button
                    onClick={() => {
                      removeItem();
                      setStatus("Удалено. Нажми «Сохранить», чтобы записать в Supabase.");
                    }}
                    className="w-full bg-white text-red-600 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors text-sm"
                    disabled={busy}
                  >
                    Удалить
                  </button>
                  {draft.link ? (
                    <a
                      href={draft.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gray-900/90 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      Открыть ссылку
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
