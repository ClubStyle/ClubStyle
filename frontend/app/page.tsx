"use client";

import Image from "next/image";
import { Search, Home as HomeIcon, Users, BookOpen, ChevronRight, X, Heart, PlayCircle, ChevronLeft } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useState, useEffect } from "react";

// Types
type Category = {
  name: string;
  subCategories?: string[];
  isEditable?: boolean; // For "adding" items logic if needed
};

type MaterialItem = {
  id: string;
  title: string;
  hashtag: string;
  image: string;
  link: string;
  description?: string;
};

const MATERIALS_DATA: MaterialItem[] = [
  { id: '1', title: "Песочные часы", hashtag: "#песочныечасы", image: "/1пес.jpg", link: "https://t.me/c/2055411531/14930" },
  { id: '2', title: "Перевернутый треугольник", hashtag: "#треугольник", image: "/треуг.jpg", link: "https://t.me/c/2055411531/14835" },
  { id: '3', title: "Яблоко", hashtag: "#яблоко", image: "/яблоко.jpg", link: "https://t.me/c/2055411531/14785" },
  { id: '4', title: "Груша", hashtag: "#груша", image: "/груша.jpg", link: "https://t.me/c/2055411531/13884" },
  { id: '5', title: "Прямоугольник", hashtag: "#прямоугольник", image: "/прямоугольник.jpg", link: "https://t.me/c/2055411531/14428" },
  { id: '6', title: "Plus size", hashtag: "#plussize", image: "/плюс.jpg", link: "https://t.me/c/2055411531/13948" },
  { id: '7', title: "Капсула", hashtag: "#капсула", image: "/капсула.jpg", link: "https://t.me/c/2055411531/12058" },
  { id: '8', title: "Образы", hashtag: "#образы", image: "/образы.jpg", link: "https://t.me/c/2055411531/13958", description: "Под этим хэштегами выкладываются готовые коллажи с образами" },
];

const CATEGORIES: Category[] = [
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
    subCategories: ["Брюки", "Топ", "Кардиган", "Футболки", "Жакет", "Юбка", "Дубленка", "Блуза", "Комбинезон", "Платье", "Куртка", "Леггинсы", "Гетры", "Гольфы", "Колготки", "Носки"]
  },
  {
    name: "Аксессуары",
    subCategories: ["Украшения", "Сумка", "Варежки", "Перчатки"]
  },
  { name: "Plus Size" },
  { 
    name: "Сезоны", 
    subCategories: ["Лето", "Зима", "Демисезон"] 
  },
  { name: "Советы" },
  { name: "Покупки по миру" },
  { name: "Покупки по РФ" },
  { name: "Конкурс" },
  { name: "Гайды и чек-листы" },
  { name: "Эфиры" },
  { name: "Мастер-классы" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subCategorySheet, setSubCategorySheet] = useState<{title: string, items: string[]} | null>(null);
  const [subCategorySearchQuery, setSubCategorySearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
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
    let material = MATERIALS_DATA.find(m => m.title === item);
    
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

  const filteredCategories = CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category.name);
    
    if (category.subCategories) {
      setSubCategorySheet({
        title: category.name,
        items: category.subCategories
      });
    } else {
      // Just select logic
      console.log("Selected:", category.name);
    }
  };

  const closeSheet = () => {
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

        {/* Video Categories Removed */}

        {/* Tags Removed */}

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
                Сегодня, 14:30
              </span>
              <div className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
            </div>
            
            <div className="w-full h-80 bg-gray-100 rounded-2xl overflow-hidden relative mb-4 border border-gray-100">
                <Image
                    src="/новое.jpg" 
                    alt="Дубленки"
                    fill
                    className="object-cover"
                />
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
                    <span key={tag} className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-lg">
                        {tag}
                    </span>
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
                        
                        const material = MATERIALS_DATA.find(m => m.title === item);
                        const titleMatch = item.toLowerCase().includes(query);
                        const hashtagMatch = material 
                            ? material.hashtag.toLowerCase().includes(query)
                            : ("#" + item.toLowerCase().replace(/\s/g, '')).includes(query);
                            
                        return titleMatch || hashtagMatch;
                    })
                    .map((item) => {
                         const material = MATERIALS_DATA.find(m => m.title === item);
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
                                     href={displayLink} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     onClick={(e) => {
                                         handleItemClick(item);
                                         e.preventDefault(); 
                                     }}
                                     className="w-full mt-2 bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                                 >
                                     <PlayCircle size={16} />
                                     Перейти к материалу
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
