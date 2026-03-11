"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { Heart, Clock, Trash2, PlayCircle, X, ChevronLeft, Search } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import Image, { type ImageProps } from "next/image";

type MaterialItem = {
  id: string;
  title: string;
  hashtag: string;
  image: string;
  link: string;
  description?: string;
  video_link?: string;
};

function SafeImage({
  src,
  alt,
  onError,
  ...props
}: Omit<ImageProps, "src"> & { src: ImageProps["src"] }) {
  const normalizeImageSrc = (input: ImageProps["src"]) => {
    if (typeof input !== "string") return input;
    const raw = input.trim();
    if (!raw) return input;
    if (raw.startsWith("/uploads/")) {
      const fileName = raw.slice("/uploads/".length);
      const path = `telegram/${fileName}`;
      return `/api/supabase-file?bucket=uploads&path=${encodeURIComponent(path)}`;
    }
    return input;
  };

  const normalizedSrc = normalizeImageSrc(src);
  const isRemote = typeof normalizedSrc === "string" && /^https?:\/\//i.test(normalizedSrc);
  const isUploads = typeof normalizedSrc === "string" && normalizedSrc.startsWith("/uploads/");
  const isWikimedia =
    typeof normalizedSrc === "string" && normalizedSrc.startsWith("https://upload.wikimedia.org/");
  const isTelegramFile =
    typeof normalizedSrc === "string" && normalizedSrc.startsWith("/api/telegram-file?");
  const isSupabaseFile =
    typeof normalizedSrc === "string" && normalizedSrc.startsWith("/api/supabase-file?");
  if (isRemote) {
    const fill = Boolean((props as { fill?: unknown })?.fill);
    const width = (props as { width?: unknown })?.width;
    const height = (props as { height?: unknown })?.height;
    const className = (props as { className?: unknown })?.className;
    const style = (props as { style?: unknown })?.style;
    const mergedStyle = fill
      ? ({
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          ...((style && typeof style === "object" ? (style as object) : {}) as object)
        } as unknown)
      : style;
    return (
      <img
        src={typeof normalizedSrc === "string" ? normalizedSrc : String(src)}
        alt={alt}
        className={typeof className === "string" ? className : undefined}
        style={mergedStyle as never}
        width={!fill && typeof width === "number" ? width : undefined}
        height={!fill && typeof height === "number" ? height : undefined}
        onError={(e) => {
          onError?.(e as unknown as never);
          const target = e.currentTarget as HTMLImageElement | null;
          if (target && target.getAttribute("src") !== "/ban.png") {
            target.setAttribute("src", "/ban.png");
          }
        }}
      />
    );
  }
  return (
    <Image
      {...props}
      src={normalizedSrc}
      alt={alt}
      unoptimized={isUploads || isWikimedia || isTelegramFile || isSupabaseFile}
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

const getEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
};

type Category = {
  name: string;
  subCategories?: string[];
  hidden?: boolean;
};

const DEFAULT_CATEGORIES: Category[] = [
  { 
    name: "Типы фигуры", 
    subCategories: ["Груша", "Яблоко", "Песочные часы", "Перевернутый треугольник", "Прямоугольник"] 
  },
  { name: "Капсула" },
  { name: "#lookдняЛена" },
  { name: "Ссылки на вещи" },
  { name: "Вещь дня" },
  { 
    name: "Обувь", 
    subCategories: ["Сапоги", "Ботильоны", "Мюли", "Туфли", "Босоножки", "Тапки"] 
  },
  {
    name: "Одежда",
    subCategories: ["Брюки", "Топ", "Кардиган", "Футболки", "Жакет", "Юбка", "Дубленка", "Блуза", "Комбинезон", "Платье", "Платья. Лето 2024", "Куртка", "Леггинсы", "Гетры", "Гольфы", "Колготки", "Носки"]
  },
  {
    name: "Аксессуары",
    subCategories: ["Украшения", "Сумка", "Варежки", "Перчатки"]
  },
  { name: "Plus Size" },
  { 
    name: "Сезоны", 
    subCategories: ["Лето", "Зима", "Демисезон", "Осенние образы для работы", "Повседневные осенние образы", "Верхняя одежда на осень", "Осенние образы с трикотажем", "Обувь и аксессуары на осень", "Осенние капсулы"] 
  },
  { 
    name: "Советы",
    subCategories: ["Советы", "Cтильные приемы, которые помогут не замерзнуть", "Как сделать базовый гардероб нескучным", "Базовый гардероб", "Фишки стилизации"]
  },
  { name: "Покупки по миру" },
  { name: "Покупки по РФ" },
  { name: "Конкурс" },
  { name: "Гайды и чек-листы" },
  { 
    name: "Эфиры",
    subCategories: [
      "Ответы на вопросы",
      "Как собрать капсулу",
      "Разбор образов участниц",
      "Осенний гардероб",
      "Ответы на вопросы участниц",
      "Разбор праздничных образов",
      "Как составить праздничный новогодний стол",
      "Неделя моды, тренды",
      "Как быть яркой"
    ]
  },
  { name: "Мастер-классы" },
  { name: "Бренды" },
];

export default function Library() {
  const [activeTab, setActiveTab] = useState<"favorites" | "recent">("favorites");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  const materialsById = useMemo(() => {
    const map = new Map<string, MaterialItem>();
    for (const m of materials) {
      if (m && typeof m.id === "string" && m.id.trim()) {
        map.set(m.id.trim(), m);
      }
    }
    return map;
  }, [materials]);

  const materialsByTitle = useMemo(() => {
    const map = new Map<string, MaterialItem>();
    for (const m of materials) {
      if (m && typeof m.title === "string" && m.title.trim()) {
        map.set(m.title.trim(), m);
      }
    }
    return map;
  }, [materials]);

  const resolveMaterial = useCallback((key: string) => {
    const k = (key || "").trim();
    if (!k) return null;
    return materialsById.get(k) || materialsByTitle.get(k) || null;
  }, [materialsById, materialsByTitle]);

  useEffect(() => {
    const readList = (raw: string | null) => {
      if (!raw) return [];
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .map((v) => {
            if (typeof v === "string") return v.trim();
            if (v && typeof v === "object") {
              const obj = v as Record<string, unknown>;
              const id = typeof obj.id === "string" ? obj.id.trim() : "";
              if (id) return id;
              const title = typeof obj.title === "string" ? obj.title.trim() : "";
              if (title) return title;
            }
            return "";
          })
          .filter(Boolean);
      } catch {
        return [];
      }
    };

    const savedFavs = localStorage.getItem("favorites");
    const savedRecent = localStorage.getItem("recent");
    setTimeout(() => setFavorites(readList(savedFavs)), 0);
    setTimeout(() => setRecent(readList(savedRecent)), 0);

    fetch(`/api/materials?key=categories&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const cleaned = (data as unknown[])
          .map((it) => (it && typeof it === "object" ? (it as Record<string, unknown>) : null))
          .map((it) => {
            const name = typeof it?.name === "string" ? it.name.trim() : "";
            const hidden = Boolean(it?.hidden);
            const subCategories = Array.isArray(it?.subCategories)
              ? it.subCategories
                  .map((s) => (typeof s === "string" ? s.trim() : ""))
                  .filter((s) => s.length > 0)
              : undefined;
            return {
              name,
              hidden,
              subCategories: subCategories && subCategories.length ? subCategories : undefined
            } satisfies Category;
          })
          .filter((it) => it.name.length > 0);
        if (!cleaned.length) return;
        setCategories(cleaned);
      })
      .catch(() => {});

    fetch(`/api/materials?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const cleaned = (data as unknown[])
          .map((it) => (it && typeof it === "object" ? (it as Record<string, unknown>) : null))
          .map((it) => {
            const id = typeof it?.id === "string" ? it.id.trim() : "";
            if (!id) return null;
            const computedLink =
              typeof it?.link === "string" && it.link.trim()
                ? it.link.trim()
                : /^\d+$/.test(id)
                  ? `https://t.me/c/2055411531/${id}`
                  : "";
            return {
              id,
              title: typeof it?.title === "string" ? it.title : id,
              hashtag: typeof it?.hashtag === "string" ? it.hashtag : "#материал",
              image: typeof it?.image === "string" ? it.image : "/ban.png",
              link: computedLink,
              description: typeof it?.description === "string" ? it.description : undefined,
              video_link: typeof it?.video_link === "string" ? it.video_link : undefined
            } satisfies MaterialItem;
          })
          .filter(Boolean) as MaterialItem[];
        setMaterials(cleaned);
      })
      .catch(() => {});
  }, []);

  const normalizedFavorites = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of favorites) {
      const key = (raw || "").trim();
      if (!key) continue;
      const resolved = resolveMaterial(key);
      const id = (resolved?.id || key).trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }, [favorites, resolveMaterial]);

  const normalizedRecent = useMemo(() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of recent) {
      const key = (raw || "").trim();
      if (!key) continue;
      const resolved = resolveMaterial(key);
      const id = (resolved?.id || key).trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }, [recent, resolveMaterial]);

  const toggleFavorite = (itemKey: string) => {
    const resolved = resolveMaterial(itemKey);
    const targetId = (resolved?.id || itemKey).trim();
    if (!targetId) return;
    setFavorites((prev) => {
      const next: string[] = [];
      let existed = false;
      const seen = new Set<string>();
      for (const raw of prev) {
        const key = (raw || "").trim();
        if (!key) continue;
        const id = (resolveMaterial(key)?.id || key).trim();
        if (!id) continue;
        if (id === targetId) {
          existed = true;
          continue;
        }
        if (seen.has(id)) continue;
        seen.add(id);
        next.push(id);
      }
      if (!existed) next.unshift(targetId);
      localStorage.setItem("favorites", JSON.stringify(next));
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.setItem("recent", JSON.stringify([]));
  };

  const handleMaterialClick = (key: string) => {
    const resolved = resolveMaterial(key);
    const isNumericId = /^\d+$/.test((key || "").trim());
    const material: MaterialItem =
      resolved ||
      ({
        id:
          (key || "").trim() ||
          `fallback-${(key || "material").toLowerCase().trim().replace(/\s+/g, "-")}`,
        title: (key || "").trim() || "Материал",
        hashtag: "#материал",
        image: "/ban.png",
        link: isNumericId ? `https://t.me/c/2055411531/${key}` : "https://t.me/c/2055411531/1"
      } satisfies MaterialItem);

    setSelectedMaterial(material);
    setActiveCategory(null); // Close category modal if open
    
    setRecent((prev) => {
      const next: string[] = [];
      const seen = new Set<string>();
      const targetId = (material.id || "").trim();
      if (targetId) {
        seen.add(targetId);
        next.push(targetId);
      }
      for (const raw of prev) {
        const key = (raw || "").trim();
        if (!key) continue;
        const id = (resolveMaterial(key)?.id || key).trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        next.push(id);
      }
      localStorage.setItem("recent", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen pb-24 font-sans relative">
      <div className="relative z-10 max-w-md mx-auto min-h-screen">
        {/* Header Tabs */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pt-12 pb-4 px-6 shadow-sm">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                activeTab === "favorites"
                  ? "bg-white text-pink-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Heart size={14} className={activeTab === "favorites" ? "fill-current" : ""} />
              Избранное
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 ${
                activeTab === "recent"
                  ? "bg-white text-pink-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Clock size={14} />
              Просмотренное
            </button>
          </div>
        </div>

        <div className="px-6 mt-6">
          {activeTab === "favorites" && (
            <div className="space-y-4">
              {normalizedFavorites.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Heart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Пока нет избранного</p>
                </div>
              ) : (
                normalizedFavorites.map((item) => {
                  const material = resolveMaterial(item);
                  const materialId = material?.id || item;
                  const title = material?.title || `Материал ${item}`;
                  const hashtag = material?.hashtag || "#сохранено";
                  const image = material?.image || "/ban.png";
                  
                  return (
                    <div 
                        key={materialId} 
                        className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex gap-4 items-center group relative overflow-hidden cursor-pointer hover:border-pink-200 transition-colors"
                        onClick={() => handleMaterialClick(materialId)}
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gray-200 shrink-0 overflow-hidden relative">
                           <SafeImage
                              src={(image || "").trim() || "/ban.png"}
                              alt="Preview"
                              fill
                              className="object-cover"
                           />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {hashtag}
                              </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                              {title}
                          </h3>
                          <p className="text-[10px] text-gray-400">Нажмите для просмотра</p>
                      </div>
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(materialId);
                          }} 
                          className="absolute top-4 right-4 p-2 text-gray-300 hover:text-pink-500 transition-colors bg-white/80 rounded-full backdrop-blur-sm z-10"
                      >
                        <Heart size={18} className="fill-pink-500 text-pink-500" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "recent" && (
            <div className="space-y-6">
               <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-black uppercase tracking-wide">Просмотренное</h2>
                  {normalizedRecent.length > 0 && (
                      <button onClick={clearRecent} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                          <Trash2 size={12} /> Очистить
                      </button>
                  )}
               </div>
               
               {normalizedRecent.length > 0 ? (
                   <div className="space-y-6">
                       {normalizedRecent.map((item, idx) => {
                         const material = resolveMaterial(item);
                         const materialId = material?.id || item;
                         const title = material?.title || item;
                         return (
                            <div key={`${item}-${idx}`} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative group">
                                {/* Image Section */}
                                <div className="relative h-48 w-full">
                                    <SafeImage
                                        src={(material?.image || "").trim() || "/ban.png"}
                                        alt={title}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                    
                                    {/* Favorite Button */}
                                    <button 
                                        onClick={() => toggleFavorite(materialId)}
                                        className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors"
                                    >
                                        <Heart 
                                            size={20} 
                                            className={`transition-colors ${normalizedFavorites.includes(materialId) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                                        />
                                    </button>
                                </div>

                                {/* Content Section */}
                                <div className="p-5">
                                    <div className="flex gap-2 mb-2">
                                        <span className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            {material ? material.hashtag : "#материал"}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                                        {title}
                                    </h3>
                                    {material?.description && (
                                        <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                                            {material.description}
                                        </p>
                                    )}
                                    
                                    {material?.link ? (
                                        <a 
                                            href={material.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full mt-2 bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <PlayCircle size={16} />
                                            Перейти к материалу
                                        </a>
                                    ) : (
                                        <button disabled className="w-full mt-2 bg-gray-100 text-gray-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm cursor-not-allowed">
                                            <PlayCircle size={16} />
                                            Материал недоступен
                                        </button>
                                    )}
                                </div>
                            </div>
                         );
                       })}
                   </div>
               ) : (
                  <div className="text-center py-12 text-gray-400">
                      <Clock size={48} className="mx-auto mb-4 opacity-20" />
                      <p>История просмотров пуста</p>
                  </div>
               )}

               {/* Categories Section - Available in Recent Tab */}
               <div className="mt-8 pt-6 border-t border-gray-100">
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1 mb-4">Категории</h3>
                   <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                        {categories.filter((cat) => !cat.hidden).map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => {
                                    if (cat.subCategories) {
                                        setActiveCategory(cat.name);
                                        setCategorySearchQuery("");
                                    } else {
                                        const material = resolveMaterial(cat.name);
                                        if (material) {
                                            handleMaterialClick(cat.name);
                                        } else {
                                            setActiveCategory(cat.name);
                                            setCategorySearchQuery("");
                                        }
                                    }
                                }}
                                className={`
                                    whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wide shadow-sm transition-all duration-200 border
                                    bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200
                                `}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Full Page View */}
      {activeCategory && (
            <div className="fixed inset-0 z-50 bg-gray-50/50 overflow-y-auto animate-in slide-in-from-right duration-300 backdrop-blur-sm">
                <div className="max-w-md mx-auto bg-white min-h-full shadow-2xl">
                    <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
                        <button 
                            onClick={() => setActiveCategory(null)}
                            className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h3 className="text-xl font-black uppercase tracking-wide">{activeCategory}</h3>
                    </div>
                    
                    <div className="p-6 space-y-6 pb-24">
                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-100/80 border-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all shadow-inner text-sm"
                            placeholder="Поиск по названию или хэштегу..."
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                        />
                    </div>

                    {categories.find(c => c.name === activeCategory)?.subCategories
                        ?.filter(sub => {
                            const query = categorySearchQuery.toLowerCase();
                            if (!query) return true;
                            
                            const material = resolveMaterial(sub);
                            const titleMatch = sub.toLowerCase().includes(query);
                            const hashtagMatch = material 
                                ? material.hashtag.toLowerCase().includes(query)
                                : ("#" + sub.toLowerCase().replace(/\s/g, '')).includes(query);
                                
                            return titleMatch || hashtagMatch;
                        })
                        .map((sub) => {
                         const material = resolveMaterial(sub);
                         const materialId = material?.id || sub;
                         const displayImage = material ? material.image : "/ban.png";
                         const displayHashtag = material ? material.hashtag : "#" + sub.toLowerCase().replace(/\s/g, '');
                         const displayLink = material ? material.link : `https://t.me/c/2055411531/1`;

                         return (
                            <div key={sub} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative group">
                                {/* Image Section */}
                                <div className="relative h-48 w-full">
                                    <SafeImage
                                        src={(displayImage || "").trim() || "/ban.png"}
                                        alt={sub}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                    
                                    {/* Favorite Button */}
                                    <button 
                                        onClick={() => toggleFavorite(materialId)}
                                        className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors"
                                    >
                                        <Heart 
                                            size={20} 
                                            className={`transition-colors ${normalizedFavorites.includes(materialId) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                                        />
                                    </button>
                                </div>

                                {/* Content Section */}
                                <div className="p-5">
                                    <div className="flex gap-2 mb-2">
                                        <span className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            {displayHashtag}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                                        {sub}
                                    </h3>
                                    {material?.description && (
                                        <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                                            {material.description}
                                        </p>
                                    )}
                                    
                                    <a 
                                        href={displayLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={() => handleMaterialClick(sub)}
                                        className="w-full mt-2 bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <PlayCircle size={16} />
                                        Перейти к материалу
                                    </a>
                                </div>
                            </div>
                         );
                    })}
                    {(!categories.find(c => c.name === activeCategory)?.subCategories) && (
                        <div className="text-center text-gray-400 py-8">
                            Нет подкатегорий
                        </div>
                    )}
                </div>
            </div>
          </div>
      )}

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setSelectedMaterial(null)}
            />
            <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button 
                    onClick={() => setSelectedMaterial(null)}
                    className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Image or Video Section */}
                <div className="relative h-64 w-full bg-black">
                    {selectedMaterial.video_link ? (
                        <iframe 
                            src={getEmbedUrl(selectedMaterial.video_link) || ""} 
                            className="absolute inset-0 w-full h-full z-10" 
                            allow="autoplay; fullscreen; picture-in-picture" 
                            allowFullScreen
                            title={selectedMaterial.title}
                        />
                    ) : (
                        <>
                            <SafeImage
                                src={(selectedMaterial.image || "").trim() || "/ban.png"}
                                alt={selectedMaterial.title}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </>
                    )}
                    
                    {/* Favorite Button */}
                    <button 
                        onClick={() => toggleFavorite(selectedMaterial!.id)}
                        className="absolute bottom-4 right-4 bg-white/30 backdrop-blur-md p-3 rounded-full hover:bg-white transition-colors border border-white/20"
                    >
                        <Heart 
                            size={24} 
                            className={`transition-colors ${normalizedFavorites.includes(selectedMaterial.id) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                        />
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-6 pt-6">
                    <div className="flex gap-2 mb-3">
                        <span className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {selectedMaterial.hashtag}
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3 leading-tight">
                        {selectedMaterial.title}
                    </h3>
                    {selectedMaterial.description && (
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            {selectedMaterial.description}
                        </p>
                    )}
                    
                    <a 
                        href={selectedMaterial.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-pink-500 text-white font-bold py-4 rounded-2xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                    >
                        <PlayCircle size={20} />
                        Перейти к материалу
                    </a>
                </div>
            </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
