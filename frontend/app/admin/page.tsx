"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";

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
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(materials)
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
  }, [headers, loadMaterials, materials]);

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

  if (!authed) {
    return (
      <main className="min-h-screen w-full px-4 lg:px-10 2xl:px-16 pt-8 pb-28">
        <div className="flex items-center gap-2 mb-8 pt-4">
          <Link
            href="/community"
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-wide text-gray-900">
            Админ
          </h1>
        </div>
        <div className="mt-6 bg-white/90 backdrop-blur rounded-3xl p-5 border border-pink-100/50 ring-1 ring-pink-50 shadow-[0_8px_32px_rgba(236,72,153,0.08)]">
          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-gray-600">Логин</span>
              <input
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="h1"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-gray-600">Пароль</span>
              <input
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                type="password"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
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
              className="mt-2 rounded-2xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200 disabled:opacity-60"
            >
              Войти
            </button>
            {status ? <div className="text-sm text-gray-700">{status}</div> : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-4 lg:px-10 2xl:px-16 pt-8 pb-28">
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-end gap-2">
            <Link
              href="/community"
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <ChevronLeft size={24} />
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-wide text-gray-900">
              Админ‑панель
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addNew}
              className="rounded-2xl bg-white/90 backdrop-blur px-4 py-2 text-sm font-semibold text-gray-900 border border-pink-100/50 ring-1 ring-pink-50"
            >
              + Добавить
            </button>
            <button
              onClick={() => saveAll().catch((e: unknown) => setStatus(e instanceof Error ? e.message : "Ошибка"))}
              disabled={busy}
              className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-200 disabled:opacity-60"
            >
              Сохранить
            </button>
          </div>
        </div>
        {status ? <div className="text-sm text-gray-700">{status}</div> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5">
        <section className="bg-white/90 backdrop-blur rounded-3xl p-4 border border-pink-100/50 ring-1 ring-pink-50 shadow-[0_8px_32px_rgba(236,72,153,0.08)]">
          <div className="grid gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="Поиск по id/названию/хэштегу/ссылке"
            />
            <div className="max-h-[calc(100vh-260px)] overflow-auto rounded-2xl border border-gray-100">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectItem(m.id)}
                  className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-pink-50 ${
                    selectedId === m.id ? "bg-pink-100/60" : "bg-white"
                  }`}
                >
                  <div className="text-xs text-gray-500">{m.id}</div>
                  <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {m.title}
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-1">{m.hashtag}</div>
                </button>
              ))}
              {!filtered.length ? (
                <div className="p-4 text-sm text-gray-600">Ничего не найдено</div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="bg-white/90 backdrop-blur rounded-3xl p-5 border border-pink-100/50 ring-1 ring-pink-50 shadow-[0_8px_32px_rgba(236,72,153,0.08)]">
          {!draft ? (
            <div className="text-sm text-gray-700">Выбери материал слева или нажми «Добавить».</div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-600">ID</span>
                  <input
                    value={draft.id}
                    onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-600">Дата (unix)</span>
                  <input
                    value={String(draft.date ?? "")}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      const n = raw ? Number(raw) : NaN;
                      setDraft({ ...draft, date: Number.isFinite(n) ? n : undefined });
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                    placeholder="1770051601"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Название</span>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Хэштеги</span>
                <input
                  value={draft.hashtag}
                  onChange={(e) => setDraft({ ...draft, hashtag: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  placeholder="#новинка #советы"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-600">Ссылка</span>
                  <input
                    value={draft.link}
                    onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-600">Видео (опц.)</span>
                  <input
                    value={draft.video_link ?? ""}
                    onChange={(e) => setDraft({ ...draft, video_link: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-600">Описание</span>
                <textarea
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={5}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                />
              </label>

              <div className="grid gap-3">
                <div className="text-xs font-medium text-gray-600">Главная картинка</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="grid gap-2">
                    <input
                      value={draft.image}
                      onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                      placeholder="https://... или /uploads/..."
                    />
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 border border-pink-100/50 ring-1 ring-pink-50">
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
                        Загрузить файл
                      </label>
                      <button
                        onClick={() => setDraft({ ...draft, image: "/ban.png" })}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 border border-gray-200"
                      >
                        Сбросить
                      </button>
                    </div>
                  </div>
                  <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                    <Image
                      src={draft.image || "/ban.png"}
                      alt="preview"
                      fill
                      className="object-cover"
                      unoptimized={typeof draft.image === "string" && draft.image.startsWith("/uploads/")}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-medium text-gray-600">Доп. картинки</div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 border border-pink-100/50 ring-1 ring-pink-50">
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
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                      />
                      <button
                        onClick={() => {
                          const next = [...(draft.images || [])];
                          next.splice(idx, 1);
                          setDraft({ ...draft, images: next });
                        }}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                  {!draft.images?.length ? (
                    <div className="text-sm text-gray-600">Пусто</div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    upsertDraft();
                    setStatus("Изменения применены локально. Нажми «Сохранить» для Supabase.");
                  }}
                  className="rounded-2xl bg-white/90 backdrop-blur px-4 py-2 text-sm font-semibold text-gray-900 border border-pink-100/50 ring-1 ring-pink-50"
                >
                  Применить
                </button>
                <button
                  onClick={removeItem}
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-red-600 border border-red-200"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
