"use client";

import Image from "next/image";
import { Search, Home as HomeIcon, Users, BookOpen, ChevronRight, X, Heart, PlayCircle, ChevronLeft } from "lucide-react";
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
  description?: string;
};

const CATEGORIES: Category[] = [
  { 
    name: "Сообщество", 
    hidden: true,
    subCategories: ["Эфиры", "Мастер-классы", "Гайды и чек-листы", "Продукты школы"] 
  },
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
  { name: "Гайды и чек-листы", hidden: true, subCategories: ["Гайд"] },
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
      "Эфир с диетологом",
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
];

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
        material = {
            id: Date.now().toString(),
            title: item,
            hashtag: "#" + item.toLowerCase().replace(/\s/g, ''),
            image: "/ban.png", // placeholder
            link: "https://t.me/c/2055411531/1" // default placeholder link
        };
    }

    setSelectedMaterial(material);
    setSubCategorySheet(null); // Close category sheet

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
              Привет, Анна!
            </h1>
            <p className="text-sm text-gray-500">Твой стиль — это ты.</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-white shadow-sm">
             {/* Avatar Placeholder */}
             <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">AV</div>
          </div>
        </div>

        {/* Banner Section */}
        <div className="relative w-full h-48 bg-white overflow-hidden rounded-3xl shadow-lg mb-8">
          <Image
            src="/ban.png"
            alt="New Season Banner"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-black uppercase tracking-wide mb-6 text-black drop-shadow-sm">
          База знаний
        </h1>

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
                                        <span className="text-[10px] text-pink-500 font-bold bg-pink-50 px-2 py-0.5 rounded-md">{item.hashtag}</span>
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

        {/* Categories Carousel (2 Rows) */}
        <div className="mb-8">
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
        </div>

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
                    src="/публ2.jpg" 
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

                        return (
                        <div key={item} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative group">
                             {/* Image Section */}
                             <div className="relative h-48 w-full">
                                 <Image
                                     src={displayImage}
                                     alt={item}
                                     fill
                                     className="object-cover"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                 
                                 {/* Favorite Button */}
                                 <button 
                                     onClick={(e) => toggleFavorite(e, item)}
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
                                 <div className="flex gap-2 mb-2">
                                     <span className="bg-pink-50 text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                         {displayHashtag}
                                     </span>
                                 </div>
                                 <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                                     {item}
                                 </h3>
                                 {material?.description && (
                                     <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                                         {material.description}
                                     </p>
                                 )}
                                 
                                 <a 
                                     href={categoryItem ? "#" : displayLink} 
                                     target={categoryItem ? "_self" : "_blank"} 
                                     rel="noopener noreferrer"
                                     onClick={(e) => {
                                         e.preventDefault(); 
                                         if (categoryItem) {
                                             handleCategoryClick(categoryItem);
                                         } else {
                                             handleItemClick(item);
                                         }
                                     }}
                                     className="w-full mt-2 bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                                 >
                                     {categoryItem ? <BookOpen size={16} /> : <PlayCircle size={16} />}
                                     {categoryItem ? "Открыть категорию" : "Перейти к материалу"}
                                 </a>
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

                {/* Image Section */}
                <div className="relative h-64 w-full">
                    <Image
                        src={selectedMaterial.image}
                        alt={selectedMaterial.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Favorite Button */}
                    <button 
                        onClick={(e) => toggleFavorite(e, selectedMaterial!.title)}
                        className="absolute bottom-4 right-4 bg-white/30 backdrop-blur-md p-3 rounded-full hover:bg-white transition-colors border border-white/20"
                    >
                        <Heart 
                            size={24} 
                            className={`transition-colors ${favorites.includes(selectedMaterial.title) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
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
