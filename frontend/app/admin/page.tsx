"use client";

import Image from "next/image";
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

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

function pickStringField(value: unknown, key: string) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const v = record[key];
  return typeof v === "string" ? v : null;
}

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState("h1");
  const [adminPass, setAdminPass] = useState("");
  const [authed, setAuthed] = useState(false);

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MaterialItem | null>(null);

  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useMemo(() => {
    return {
      "x-admin-user": adminUser,
      "x-admin-pass": adminPass
    };
  }, [adminUser, adminPass]);

  const loadMaterials = useCallback(async () => {
    setStatus(null);
    const res = await fetch("/api/materials", { cache: "no-store" });
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

  useEffect(() => {
    if (!authed) return;
    loadMaterials().catch((e: unknown) => {
      setStatus(e instanceof Error ? e.message : "Ошибка загрузки");
    });
  }, [authed, loadMaterials]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => {
      const hay = `${m.id} ${m.title} ${m.hashtag} ${m.link}`.toLowerCase();
      return hay.includes(q);
    });
  }, [materials, filter]);

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
                  onClick={addNew}
                  className="bg-white text-gray-700 border border-gray-100 font-bold px-4 py-2 rounded-2xl shadow-sm hover:bg-gray-50 transition-colors text-xs"
                >
                  + Добавить
                </button>
                <button
                  onClick={() =>
                    saveAll().catch((e: unknown) =>
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
                    placeholder="6789"
                  />
                </label>
                <button
                  onClick={() => {
                    if (adminUser.trim() === "h1" && adminPass === "6789") {
                      setAuthed(true);
                      setStatus(null);
                    } else {
                      setStatus("Неверный логин или пароль");
                    }
                  }}
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
                />
              </div>
              {status ? (
                <div className="mt-3 text-sm text-gray-600">{status}</div>
              ) : null}
            </div>
          )}
        </div>

        {authed ? (
          <div className="px-4 lg:px-10 2xl:px-16 mt-6 grid gap-3 md:grid-cols-2">
            {filtered.map((m) => {
              const badge =
                m.hashtag?.split(" ").map((t) => t.trim()).filter(Boolean)[0] ||
                "#материал";
              const isUploads =
                typeof m.image === "string" && m.image.startsWith("/uploads/");
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
                    <Image
                      src={m.image || "/ban.png"}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={isUploads}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                      {m.title}
                    </h3>
                    <div className="text-xs text-gray-400 font-medium">
                      id: {m.id}
                    </div>
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
        ) : null}
      </div>

      <BottomNav />

      {draft ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => {
              setDraft(null);
              setSelectedId(null);
            }}
          />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => {
                setDraft(null);
                setSelectedId(null);
              }}
              className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative h-64 w-full bg-black">
              <Image
                src={draft.image || "/ban.png"}
                alt={draft.title}
                fill
                className="object-cover"
                unoptimized={typeof draft.image === "string" && draft.image.startsWith("/uploads/")}
              />
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
                Загрузить обложку
              </label>
            </div>

            <div className="p-6 pt-6">
              <div className="flex gap-2 mb-3">
                <span className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {draft.hashtag || "#материал"}
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
                    Хэштеги
                  </span>
                  <input
                    value={draft.hashtag}
                    onChange={(e) => setDraft({ ...draft, hashtag: e.target.value })}
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    placeholder="#новинка #советы"
                  />
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
