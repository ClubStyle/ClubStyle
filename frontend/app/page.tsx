"use client";

import Image from "next/image";
import { Search, Home as HomeIcon, Users, BookOpen, ChevronRight, X, Heart, PlayCircle, ChevronLeft, ExternalLink, Play } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Types
type Category = {
  name: string;
  subCategories?: string[];
  isEditable?: boolean; // For "adding" items logic if needed
  hidden?: boolean;
};

type MaterialItem = {
  id: string;
  title: string;
  hashtag: string;
  image: string;
  link: string;
  video_link?: string;
  description?: string;
  type?: string;
  image_position?: string;
};

const CATEGORIES: Category[] = [
  { 
    name: "Сообщество", 
    hidden: true,
    subCategories: ["Эфиры", "Мастер-классы", "Гайды и чек-листы", "Мои обучения", "Разбор образов участниц"] 
  },
  { 
    name: "Типы фигуры", 
    subCategories: ["Груша", "Яблоко", "Песочные часы", "Перевернутый треугольник", "Прямоугольник"] 
  },
  { name: "Капсула" },
  { name: "Идеи образов" }, // New
  { name: "Разборы образов" }, // New (alias for subcategory or separate)
  { name: "#lookдняЛена" },
  { name: "Ссылки на вещи" },
  { name: "Вещь дня" },
  { 
    name: "Обувь", 
    subCategories: ["Сапоги", "Ботильоны", "Мюли", "Туфли", "Босоножки", "Тапки", "Зимние инвестиции: расслабленная обувь"] 
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
  { name: "Гайды и чек-листы", hidden: true, subCategories: ["Новогодние образы"] },
  { 
    name: "Эфиры",
    hidden: true,
    subCategories: [
      "Ответы на вопросы",
      "Как собрать капсулу",
      "Разбор образов участниц",
      "Осенний гардероб",
      "Ответы на вопросы участниц",
      "Эфир с Леной",
      "Запись с диетологом",
      "Неделя моды, тренды",
      "Как быть яркой"
    ]
  },
  { 
    name: "Мастер-классы", 
    hidden: true,
    subCategories: [
      "Какие головные уборы можно добавлять в свои образы",
      "Как продолжать носить вещи, которые вы купили для праздников",
      "«Я верю себе:внутренние опоры как источник женской силы»"
    ] 
  },
  { name: "Бренды" },
  {
    name: "Мои обучения",
    hidden: true,
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
];

const QUICK_FILTERS = [
    { label: "типы фигур", category: "Типы фигуры" },
    { label: "plus size", category: "Plus Size" },
    { label: "находки в рф", category: "Покупки по РФ" },
    { label: "находки мир", category: "Покупки по миру" },
    { label: "обувь", category: "Обувь" },
    { label: "сумки", category: "Аксессуары" },
    { label: "верхняя одежда", category: "Сезоны" },
    { label: "верха", category: "Одежда" },
    { label: "низы", category: "Одежда" },
    { label: "аксессуары", category: "Аксессуары" },
    { label: "образы участниц", category: "Разборы образов" }
];

const MENU_ITEMS = [
  { title: "ОБЗОРЫ БРЕНДОВ", image: "/обзорыбрендов.png", category: "Бренды", count: 18 },
  { title: "ИДЕИ ОБРАЗОВ", image: "/идеиобразов.png", category: "Идеи образов", count: 11 },
  { title: "МАСТЕР-КЛАССЫ", image: "/мастерклассы.png", category: "Мастер-классы", count: 99 },
  { title: "ГАЙДЫ", image: "/гайды2.png", category: "Гайды и чек-листы", count: 2 },
  { title: "РАЗБОРЫ ОБРАЗОВ", image: "/разборыобразов.png", category: "Разборы образов", count: 70 },
  { title: "ОБУЧЕНИЯ", image: "/обучения.png", category: "Мои обучения", count: 53 },
  { title: "СОВЕТЫ И ЛАЙФХАКИ", image: "/советылайф.png", category: "Советы", count: 37 },
  { title: "ОБРАЗЫ", image: "/образы.png", category: "#lookдняЛена", count: 7 },
];

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

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subCategorySheet, setSubCategorySheet] = useState<{title: string, items: string[]} | null>(null);
  const [subCategorySearchQuery, setSubCategorySearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [tgUser, setTgUser] = useState<{first_name: string, photo_url?: string} | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Handle URL params for direct category access
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
        const category = CATEGORIES.find(c => c.name === categoryParam);
        if (category) {
            handleCategoryClick(category);
        }
    }
  }, [searchParams]);


  useEffect(() => {
    // Fetch materials from API
    fetch('/api/materials')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setMaterials(data);
            }
        })
        .catch(err => console.error("Failed to fetch materials:", err));

    const savedFavs = localStorage.getItem("favorites");
    const savedRecent = localStorage.getItem("recent");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedRecent) setRecent(JSON.parse(savedRecent));

    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        if (tg.initDataUnsafe?.user) {
            setTgUser(tg.initDataUnsafe.user);
        }
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(item)) {
        newFavs = favorites.filter(i => i !== item);
    } else {
        newFavs = [...favorites, item];
    }
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
  };

  const handleItemClick = (item: string) => {
    let material = materials.find(m => m.title === item);
    
    // Fallback if not found in data
    if (!material) {
        if (item === "Бренды") {
            material = {
                id: "brands_review_fallback",
                title: "Бренды",
                hashtag: "#бренды",
                image: "/ban.png",
                type: "text",
                link: "https://t.me/c/2055411531/1",
                description: "ZARA (май 2024)\nLOVE REPUBLIC (июнь 2024)\nBEFREE (август 2024)\nZARINA (август 2024)\nH&M (август 2024)\nMAAG мини обзор (август 2024)\n4FORMS (август 2024)\nASOS CURVE (сентябрь 2024)\nLIME (сентябрь 2024)\nMANGO (октябрь 2024)\nEKONIKA (октябрь 2024)\nSHUBECO (октябрь 2024)\nFOREVER 21 (ноябрь 2024)\nMAAG (новогодняя коллекция 2024)\nZARINA (новогодняя коллекция 2024)\nDAISYKNIT (новогодняя коллекция 2024)\nALL WE NEED (новогодняя коллекция 2024)\nMONZA| Моностиль (новогодняя коллекция 2024)\nRESERVED (новогодняя коллекция 2024)\nLIME (январь 2025)\nLOVE REPUBLIC (февраль 2025)\nLICHI (верхняя одежда февраль 2025)\nIDOL (март 2025)\nZARINA (март 2025)\nSELA (апрель 2025)\nMANGO (сентябрь 2025)"
            };
        } else {
            material = {
                id: Date.now().toString(),
                title: item,
                hashtag: "#" + item.toLowerCase().replace(/\s/g, ''),
                image: "/ban.png", // placeholder
                link: "https://t.me/c/2055411531/1" // default placeholder link
            };
        }
    }

    setSelectedMaterial(material);
    // setSubCategorySheet(null); // Keep category sheet open for "Back" navigation

    if (!recent.includes(item)) {
        const newRecent = [item, ...recent.filter(i => i !== item)].slice(0, 20);
        setRecent(newRecent);
        localStorage.setItem("recent", JSON.stringify(newRecent));
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    const items = materials.filter(m => m.hashtag.includes(hashtag)).map(m => m.title);
    setSubCategorySheet({
        title: hashtag,
        items: items
    });
    setActiveCategory(hashtag);
  };

  const filteredCategories = CATEGORIES.filter(cat => 
    !cat.hidden && cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMaterials = searchQuery 
      ? materials.filter(m => 
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          m.hashtag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  const foundSubCategories = searchQuery
      ? CATEGORIES.flatMap(cat => 
          (cat.subCategories || [])
            .filter(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(sub => ({ sub, parent: cat }))
        )
      : [];

  const handleCategoryClick = (category: Category) => {
    if (category.subCategories) {
      setActiveCategory(category.name);
      setSubCategorySheet({
        title: category.name,
        items: category.subCategories
      });
    } else {
      // Check if it matches a material item directly
      const material = materials.find(m => m.title === category.name);
      if (material) {
          handleItemClick(category.name);
      } else {
          setActiveCategory(category.name);
          console.log("Selected:", category.name);
      }
    }
  };

  const closeSheet = () => {
    const fromParam = searchParams.get('from');
    if (fromParam === 'community') {
        router.push('/community');
        return;
    }
    setSubCategorySheet(null);
    setActiveCategory(null); // Optional: clear selection on close
  };

  return (
    <div className="min-h-screen pb-24 font-sans relative overflow-hidden">
      
      <div className="relative z-10 max-w-md mx-auto min-h-screen p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black text-black">
              Привет, {tgUser?.first_name || "Анна"}!
            </h1>
            <p className="text-sm text-gray-500">Твой стиль — это ты.</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm relative">
             {tgUser?.photo_url ? (
                <Image src={tgUser.photo_url} alt="Avatar" fill className="object-cover" />
             ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
                    {tgUser?.first_name?.[0] || "AV"}
                </div>
             )}
          </div>
        </div>

        {/* Grid Navigation (Replaces Banner and Carousel) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
            {MENU_ITEMS.map((item, index) => (
                <button 
                    key={index}
                    onClick={() => {
                        const cat = CATEGORIES.find(c => c.name === item.category);
                        if (cat) handleCategoryClick(cat);
                    }}
                    className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group active:scale-[0.98] transition-transform"
                >
                    <Image 
                        src={item.image} 
                        alt={item.title} 
                        fill 
                        className="object-cover"
                    />
                    {/* Dark Overlay - removed */}
                    {/* <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div> */}
                    
                    {/* Badge - removed */}
                    {/* <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                        {item.count}
                    </div> */}

                    {/* Title - removed */}
                    {/* <div className="absolute bottom-3 left-3 right-3 text-left">
                        <span className="text-white font-black text-sm uppercase leading-tight drop-shadow-md">
                            {item.title}
                        </span>
                    </div> */}
                </button>
            ))}
        </div>

        {/* Title (Hidden/Removed if Grid is main nav) */}
        {/* <h1 className="text-center text-2xl font-black uppercase tracking-wide mb-6 text-black drop-shadow-sm">
          База знаний
        </h1> */}

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-100/80 border-none text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-pink-200 focus:bg-white transition-all shadow-inner text-sm"
            placeholder="Поиск категорий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Filters (Restored & Reordered) */}
        <div className="mb-8">
            <div className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                {QUICK_FILTERS.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            const cat = CATEGORIES.find(c => c.name === item.category);
                            if (cat) handleCategoryClick(cat);
                        }}
                        className={`
                            whitespace-nowrap px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wide border transition-all duration-200
                            ${activeCategory === item.category 
                                ? "bg-black text-white border-black" 
                                : "bg-white text-gray-900 border-gray-300 hover:border-gray-900"
                            }
                        `}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Search Results */}
        {(searchQuery && (filteredMaterials.length > 0 || foundSubCategories.length > 0)) && (
            <div className="mb-8 space-y-6">
                 {/* Found Materials */}
                 {filteredMaterials.length > 0 && (
                    <div>
                        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">
                            Найденные материалы
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {filteredMaterials.map(item => (
                                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 items-center" onClick={() => handleItemClick(item.title)}>
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">{item.title}</h3>
                                        <div className="flex flex-wrap gap-1">
                                            {item.hashtag.split(' ').map((tag, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleHashtagClick(tag);
                                                    }}
                                                    className="text-[10px] text-pink-500 font-bold bg-pink-50 px-2 py-0.5 rounded-md hover:bg-pink-100 transition-colors"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

                 {/* Found Subcategories */}
                 {foundSubCategories.length > 0 && (
                    <div>
                         <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">
                            Найденные темы
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {foundSubCategories.map(({ sub, parent }) => (
                                <button
                                    key={`${parent.name}-${sub}`}
                                    onClick={() => handleCategoryClick(parent)}
                                    className="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-100 shadow-sm hover:bg-gray-50 hover:border-pink-200 transition-all"
                                >
                                    <span className="text-gray-400 mr-1">{parent.name} /</span> {sub}
                                </button>
                            ))}
                        </div>
                    </div>
                 )}
            </div>
        )}

        {/* Categories Carousel (Hidden as requested) */}
        {/* <div className="mb-8">
            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                {filteredCategories.map((cat) => (
                    <button
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat)}
                        className={`
                            whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wide shadow-sm transition-all duration-200 border
                            ${activeCategory === cat.name 
                                ? "bg-black text-white border-black transform scale-105" 
                                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                            }
                        `}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div> */}

        {/* Events Section */}
        <div className="mb-24">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">
            События
          </h2>
          
          <a 
            href="https://t.me/c/2055411531/15005"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-white/50 transition-transform active:scale-95"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-semibold text-gray-400">
                22 января, 17:02
              </span>
              <div className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
            </div>
            
            <div className="w-full h-80 bg-gray-100 rounded-2xl overflow-hidden relative mb-4 border border-gray-100">
                <Image
                    src="/событие2.jpg" 
                    alt="Дубленки"
                    fill
                    className="object-cover"
                />
                <button 
                    onClick={(e) => toggleFavorite(e, "event_15005")}
                    className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors z-10"
                >
                    <Heart 
                        size={20} 
                        className={`transition-colors ${favorites.includes("event_15005") ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                    />
                </button>
            </div>

            <div className="space-y-3 text-xs text-gray-800 font-medium mb-4">
                <div className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="pr-2">Дубленка-косуха из овчины Снежная Королева</span>
                    <span className="font-bold whitespace-nowrap">28 790 р.</span>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="pr-2">Дубленка Wildberries</span>
                    <span className="font-bold whitespace-nowrap">21 164 р.</span>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="pr-2">Дубленка Wildberries</span>
                    <span className="font-bold whitespace-nowrap">14 770 р.</span>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="pr-2">Дубленка Wildberries</span>
                    <span className="font-bold whitespace-nowrap">12 814 р.</span>
                </div>
                <div className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="pr-2">Дубленка с отделкой искусственным мехом ASOS</span>
                    <span className="font-bold whitespace-nowrap">120,00 $</span>
                </div>
                 <div className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="pr-2">Удлиненная дубленка-авиатор шоколадного цвета TOPSHOP</span>
                    <span className="font-bold whitespace-nowrap">82,28 $</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {["#верхняяодежда", "#покупкивроссии", "#покупкипомиру", "#ссылкинавещи"].map(tag => (
                    <button 
                        key={tag} 
                        onClick={(e) => {
                            e.preventDefault();
                            handleHashtagClick(tag);
                        }}
                        className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                        {tag}
                    </button>
                ))}
            </div>
          </a>

          <a 
            href="https://t.me/c/2055411531/14996"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-white/50 transition-transform active:scale-95 mt-4"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-semibold text-gray-400">
                22 января, 17:02
              </span>
              <div className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
            </div>
            
            <div className="w-full h-80 bg-gray-100 rounded-2xl overflow-hidden relative mb-4 border border-gray-100">
                <Image
                    src="/событие2.jpg" 
                    alt="Шубы"
                    fill
                    className="object-cover"
                />
                <button 
                    onClick={(e) => toggleFavorite(e, "event_14996")}
                    className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors z-10"
                >
                    <Heart 
                        size={20} 
                        className={`transition-colors ${favorites.includes("event_14996") ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                    />
                </button>
            </div>

            <div className="text-xs text-gray-800 font-medium mb-4 leading-relaxed">
               Привет, стильные ✨<br/>
               Когда мы говорим про зимнюю верхнюю одежду, нельзя не упомянуть шубы. Тем более, что тренд на меховые изделия прочно держится уже не один сезон.
            </div>

            <div className="flex flex-wrap gap-2">
                {["#верхняяодежда", "#покупкивроссии", "#покупкипомиру", "#ссылкинавещи"].map(tag => (
                    <button 
                        key={tag} 
                        onClick={(e) => {
                            e.preventDefault();
                            handleHashtagClick(tag);
                        }}
                        className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                        {tag}
                    </button>
                ))}
            </div>
          </a>
        </div>

      </div>

      {/* Sub-Category Full Page View */}
      {subCategorySheet && (
          <div className="fixed inset-0 z-50 bg-gray-50/50 overflow-y-auto animate-in slide-in-from-right duration-300 backdrop-blur-sm">
             <div className="max-w-md mx-auto bg-white min-h-full shadow-2xl">
                 {/* Header */}
                 <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
                    <button onClick={closeSheet} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-xl font-black uppercase tracking-wide">{subCategorySheet.title}</h3>
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
                        value={subCategorySearchQuery}
                        onChange={(e) => setSubCategorySearchQuery(e.target.value)}
                    />
                </div>

                {subCategorySheet.items
                    .filter(item => {
                        const query = subCategorySearchQuery.toLowerCase();
                        if (!query) return true;
                        
                        const material = materials.find(m => m.title === item);
                        const titleMatch = item.toLowerCase().includes(query);
                        const hashtagMatch = material 
                            ? material.hashtag.toLowerCase().includes(query)
                            : ("#" + item.toLowerCase().replace(/\s/g, '')).includes(query);
                            
                        return titleMatch || hashtagMatch;
                    })
                    .map((item) => {
                         const material = materials.find(m => m.title === item);
                         const categoryItem = CATEGORIES.find(c => c.name === item && c.subCategories);

                         const displayImage = material ? material.image : "/ban.png";
                         const displayHashtag = material ? material.hashtag : "#" + item.toLowerCase().replace(/\s/g, '');
                         const displayLink = material ? material.link : `https://t.me/c/2055411531/1`;

                         const handleCardClick = () => {
                            if (categoryItem) {
                                handleCategoryClick(categoryItem);
                            } else {
                                // Logic to handle "folders" of materials (same hashtag)
                                const query = item.toLowerCase().replace(/\s/g, '');
                                // Check if we are not already inside this folder
                                if (subCategorySheet.title !== item) {
                                     // Find materials that match this item as a hashtag
                                     const relatedMaterials = materials.filter(m => 
                                         m.hashtag.toLowerCase().includes(query) || 
                                         m.hashtag.toLowerCase().includes("#" + query)
                                     );
                                     
                                     if (relatedMaterials.length > 1) {
                                          setSubCategorySheet({
                                              title: item, // Keep title same as item name to prevent re-opening on click
                                              items: relatedMaterials.map(m => m.title)
                                          });
                                          return;
                                     }
                                }
                                handleItemClick(item);
                            }
                         };

                        if (material?.type === 'text') {
                             return (
                                <div key={item} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative group transition-transform">
                                     <div className="flex flex-wrap gap-2 mb-4">
                                         {displayHashtag.split(' ').map((tag, i) => (
                                             <button
                                                 key={i}
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     handleHashtagClick(tag);
                                                 }}
                                                 className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider hover:bg-pink-100 transition-colors"
                                             >
                                                 {tag}
                                             </button>
                                         ))}
                                     </div>
                                     <h3 className="text-xl font-black text-gray-900 mb-4 leading-tight">
                                         {item}
                                     </h3>
                                     <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                         {material.description}
                                     </div>
                                </div>
                             );
                        }

                        return (
                        <div key={item} onClick={handleCardClick} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative group cursor-pointer active:scale-[0.98] transition-transform">
                             {/* Image Section */}
                             <div className="relative h-48 w-full">
                                 <Image
                                     src={displayImage}
                                     alt={item}
                                     fill
                                    className={`object-contain ${material?.image_position || "object-center"}`}
                                />
                                 
                                 {/* Favorite Button */}
                                 <button 
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         toggleFavorite(e, item);
                                     }}
                                     className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors"
                                 >
                                     <Heart 
                                         size={20} 
                                         className={`transition-colors ${favorites.includes(item) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                                     />
                                 </button>
                             </div>

                             {/* Content Section */}
                             <div className="p-5">
                                 <div className="flex flex-wrap gap-2 mb-2">
                                     {displayHashtag.split(' ').map((tag, i) => (
                                         <button
                                             key={i}
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleHashtagClick(tag);
                                             }}
                                             className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider hover:bg-pink-100 transition-colors"
                                         >
                                             {tag}
                                         </button>
                                     ))}
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                                     {item}
                                 </h3>
                                 {material?.description && (
                                    <p className="text-gray-500 text-xs mb-4 leading-relaxed line-clamp-2">
                                        {material.description}
                                    </p>
                                )}
                                
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault(); 
                                        e.stopPropagation();
                                        handleCardClick();
                                    }}
                                    className="w-full mt-2 bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md shadow-pink-100"
                                >
                                    {categoryItem ? <BookOpen size={16} /> : <PlayCircle size={16} />}
                                    {categoryItem ? "Открыть категорию" : "Смотреть"}
                                </button>
                             </div>
                        </div>
                    )})}
                {/* Fallback if no items */}
                {subCategorySheet.items.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                        Нет подкатегорий
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Material Full Screen View */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
            {/* Header with Back Button */}
            <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-4 pointer-events-none">
                 <button 
                    onClick={() => setSelectedMaterial(null)}
                    className="pointer-events-auto flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-full hover:bg-black/40 transition-colors shadow-sm"
                 >
                    <ChevronLeft size={18} />
                    <span className="text-sm font-medium">Назад</span>
                 </button>
            </div>

            <div className="pt-20">
                {/* Hero Image Section - Only for non-text types */}
                {selectedMaterial.type !== 'text' && (
                    <div className={`relative mx-4 rounded-[20px] overflow-hidden bg-black shadow-md shrink-0 ${
                        selectedMaterial.hashtag?.toLowerCase().includes('#эфиры') ? 'aspect-[16/9]' : 'aspect-auto'
                    }`}>
                        {selectedMaterial.video_link && getEmbedUrl(selectedMaterial.video_link) ? (
                            <iframe
                                src={getEmbedUrl(selectedMaterial.video_link)!}
                                title={selectedMaterial.title}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <>
                                <Image
                                    src={selectedMaterial.image}
                                    alt={selectedMaterial.title}
                                    {...(selectedMaterial.hashtag?.toLowerCase().includes('#эфиры')
                                        ? { 
                                            fill: true,
                                            className: "object-cover object-center opacity-90"
                                          }
                                        : {
                                            width: 800, 
                                            height: 600,
                                            className: "w-full h-auto object-contain opacity-90"
                                          }
                                    )}
                                />
                                <div className="absolute inset-0 bg-black/20" />
                                
                                {/* Play Button Overlay */}
                                {selectedMaterial.hashtag?.toLowerCase().includes('#эфиры') && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center pl-1 border border-white/30 shadow-2xl">
                                        <Play size={32} fill="white" className="text-white" />
                                    </div>
                                </div>
                                )}

                                {/* Fake Video Controls */}
                                {selectedMaterial.hashtag?.toLowerCase().includes('#эфиры') && (
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none">
                                    <div className="h-1 bg-white/30 rounded-full overflow-hidden mb-2">
                                        <div className="h-full w-1/3 bg-pink-500 rounded-full relative">
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm scale-150"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/90 font-medium font-mono">
                                        <span>04:20</span>
                                        <span>15:00</span>
                                    </div>
                                </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Content Container */}
                <div className="relative z-10 bg-white px-6 pt-6 pb-40">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {selectedMaterial.hashtag.split(' ').map((tag, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setSelectedMaterial(null);
                                    handleHashtagClick(tag);
                                }}
                                className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-pink-100 transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 mb-6 leading-tight">
                        {selectedMaterial.title}
                    </h2>

                    {selectedMaterial.description && (
                        <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-wrap mb-8">
                            {selectedMaterial.description}
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Bottom Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 pb-8 z-20">
                 <div className="flex flex-col gap-3 max-w-md mx-auto">
                      <button 
                          onClick={(e) => toggleFavorite(e, selectedMaterial.title)}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all border ${
                              favorites.includes(selectedMaterial.title)
                                  ? "bg-pink-50 border-pink-200 text-pink-500"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                          <Heart size={20} className={favorites.includes(selectedMaterial.title) ? "fill-current" : ""} />
                          {favorites.includes(selectedMaterial.title) ? "В избранном" : "Добавить в избранное"}
                      </button>

                      {selectedMaterial.video_link && (
                          <a 
                              href={selectedMaterial.video_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                          >
                              <PlayCircle size={20} />
                              Смотреть запись
                          </a>
                      )}

                      <a 
                          href={selectedMaterial.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-pink-500 text-white font-bold py-3.5 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                      >
                          <ExternalLink size={20} />
                          {selectedMaterial.id.startsWith('edu_') ? "Смотреть" : "Перейти к оригинальному посту"}
                      </a>
                 </div>
            </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
