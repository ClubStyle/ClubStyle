"use client";

import Image from "next/image";
import { Search, Home as HomeIcon, Users, BookOpen, ChevronRight, X, Heart } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useState, useEffect } from "react";

// Types
type Category = {
  name: string;
  subCategories?: string[];
  isEditable?: boolean; // For "adding" items logic if needed
};

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
    const newRecent = [item, ...recent.filter(i => i !== item)].slice(0, 20);
    setRecent(newRecent);
    localStorage.setItem("recent", JSON.stringify(newRecent));
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

      {/* Sub-Category Bottom Sheet */}
      {subCategorySheet && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={closeSheet}></div>
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-50 p-6 pb-24 animate-in slide-in-from-bottom duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-w-md mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black uppercase tracking-wide">{subCategorySheet.title}</h3>
                    <button onClick={closeSheet} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {subCategorySheet.items.map((item) => (
                        <div key={item} onClick={() => handleItemClick(item)} className="p-4 bg-gray-50 rounded-2xl text-left font-bold text-sm text-gray-800 hover:bg-pink-50 hover:text-pink-600 transition-colors flex justify-between items-center group cursor-pointer relative">
                            <span className="pr-6">{item}</span>
                            <button 
                                onClick={(e) => toggleFavorite(e, item)}
                                className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/50 transition-colors"
                            >
                                <Heart 
                                    size={18} 
                                    className={`transition-colors ${favorites.includes(item) ? "fill-pink-500 text-pink-500" : "text-gray-300 hover:text-pink-400"}`} 
                                />
                            </button>
                        </div>
                    ))}
                    {/* Add Button Placeholder */}
                    <button className="p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center font-bold text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                        + Добавить
                    </button>
                </div>
            </div>
          </>
      )}

      <BottomNav />
    </div>
  );
}
