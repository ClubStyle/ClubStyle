"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, Trash2, PlayCircle, X, ChevronLeft, Search } from "lucide-react";
import BottomNav from "../../components/BottomNav";
import Image from "next/image";

type MaterialItem = {
  id: string;
  title: string;
  hashtag: string;
  image: string;
  link: string;
  description?: string;
};

type Category = {
  name: string;
  subCategories?: string[];
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

const MATERIALS_DATA: MaterialItem[] = [
  { id: '1', title: "Песочные часы", hashtag: "#песочныечасы", image: "/1пес.jpg", link: "https://t.me/c/2055411531/14930" },
  { id: '2', title: "Перевернутый треугольник", hashtag: "#треугольник", image: "/треуг.jpg", link: "https://t.me/c/2055411531/14835" },
  { id: '3', title: "Яблоко", hashtag: "#яблоко", image: "/яблоко.jpg", link: "https://t.me/c/2055411531/14785" },
  { id: '4', title: "Груша", hashtag: "#груша", image: "/груша.jpg", link: "https://t.me/c/2055411531/13884" },
  { id: '5', title: "Прямоугольник", hashtag: "#прямоугольник", image: "/прямоугольник.jpg", link: "https://t.me/c/2055411531/14428" },
  { id: '6', title: "Plus size", hashtag: "#plussize", image: "/плюс.jpg", link: "https://t.me/c/2055411531/13948" },
  { id: '7', title: "Капсула", hashtag: "#капсула", image: "/капсула.jpg", link: "https://t.me/c/2055411531/12058" },
  { id: '8', title: "Образы", hashtag: "#образы", image: "/образы.jpg", link: "https://t.me/c/2055411531/13958", description: "Под этим хэштегами выкладываются готовые коллажи с образами" },
  { id: '9', title: "Покупки по РФ", hashtag: "#образы #песочныечасы #прямоугольник #груша #яблоко #plussize #жакет #топ #юбка #сапоги #шуба #сумка #украшения #ссылкинавещи #покупкивроссии", image: "/пороссии.jpg", link: "https://t.me/c/2055411531/14810" },
  { id: '10', title: "Покупки по миру", hashtag: "#покупкипомиру", image: "/помиру.jpg", link: "https://t.me/c/2055411531/14821", description: "Ссылки на покупки зарубежом" },
  { id: '11', title: "#lookдняЛена", hashtag: "#lookдняЛена", image: "/лук.jpg", link: "https://t.me/c/2055411531/14859" },
  { id: '12', title: "Вещь дня", hashtag: "#вещьдня", image: "/лукдня.jpg", link: "https://t.me/c/2055411531/14862", description: "Еще одна вещь: https://t.me/c/2055411531/14861" },
  { id: '13', title: "Советы", hashtag: "#советы", image: "/ban.png", link: "https://t.me/c/2055411531/14959" },
  { id: '14', title: "Ответы на вопросы", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/651", description: "Дорогие участницы, вчера прошёл закрытый эфир Клуба стильных, где Лена отвечала на ваши вопросы ❤️" },
  { id: '15', title: "Как собрать капсулу", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/1544", description: "Вчера состоялся наш закрытый эфир только для участниц Клуба на тему «Капсульный гардероб»!" },
  { id: '16', title: "Разбор образов участниц", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/2046", description: "Мы разобрали ваши образы, которые вы присылали в чат Клуба." },
  { id: '17', title: "Осенний гардероб", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/2924", description: "Вчера состоялся наш закрытый эфир только для участниц Клуба на тему «Осенний гардероб», где я отвечала на ваши вопросы ❤️" },
  { id: '18', title: "Ответы на вопросы участниц", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/4214", description: "Вчера состоялся наш закрытый эфир только для участниц Клуба, где я отвечала на ваши вопросы ❤️" },
  { id: '19', title: "Разбор праздничных образов", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/4742", description: "я разбирала ваши праздничные образы❤️" },
  { id: '20', title: "Как составить праздничный новогодний стол", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/4847", description: "В субботу состоялся закрытый эфир с диетологом Анастасией Егоровой, на котором Анастасия рассказывала как подготовиться к новогоднему застолью 🥗" },
  { id: '21', title: "Неделя моды, тренды", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/7595", description: "Вчера состоялся наш закрытый эфир только для участниц Клуба, где я рассказывала про неделю моды в Париже, делилась впечатлениями и историями со стритстайла..." },
  { id: '22', title: "Как быть яркой", hashtag: "#эфиры", image: "/ЭФИРЫ.png", link: "https://t.me/c/2055411531/9498", description: "В субботу состоялся закрытый эфир с психологом Ольгой Добряковой, на котором обсуждали очень важную тему о том, как разрешить себе быть яркой..." },
  { id: '23', title: "Мастер-классы", hashtag: "#мастеркласс", image: "/МАСТЕРКЛ.png", link: "https://t.me/c/2055411531/13191", description: "Привет, стильные ✨ Октябрь в Клубе стильных был посвящен теме \"Как быть стильной, когда пора утепляться\", и завершить его я хочу своим мастер классом 🔥" },
  { id: '24', title: "Платья. Лето 2024", hashtag: "#платья", image: "/платья.png", link: "https://t.me/c/2055411531/9" },
  { id: '25', title: "Cтильные приемы, которые помогут не замерзнуть", hashtag: "#советы", image: "/приемы.png", link: "https://t.me/c/2055411531/13050" },
  { id: '26', title: "Бренды", hashtag: "#бренды", image: "/ban.png", link: "https://t.me/c/2249399970/3/41" },
  { id: '27', title: "Осенние образы для работы", hashtag: "#осень", image: "/70.jpg", link: "https://t.me/c/2055411531/12880" },
  { id: '28', title: "Повседневные осенние образы", hashtag: "#осень", image: "/ban.png", link: "https://t.me/c/2055411531/12717" },
  { id: '29', title: "Верхняя одежда на осень", hashtag: "#осень", image: "/ban.png", link: "https://t.me/c/2055411531/12564" },
  { id: '30', title: "Осенние образы с трикотажем", hashtag: "#трикотаж", image: "/ban.png", link: "https://t.me/c/2055411531/12402" },
  { id: '31', title: "Как сделать базовый гардероб нескучным", hashtag: "#советы", image: "/ban.png", link: "https://t.me/c/2055411531/12248" },
  { id: '32', title: "Обувь и аксессуары на осень", hashtag: "#mango", image: "/ban.png", link: "https://t.me/c/2055411531/12098" },
  { id: '33', title: "Осенние капсулы", hashtag: "#капсула", image: "/ban.png", link: "https://t.me/c/2055411531/11955" },
  { id: '34', title: "Базовый гардероб", hashtag: "#база", image: "/ban.png", link: "https://t.me/c/2055411531/11803" },
  { id: '35', title: "Фишки стилизации", hashtag: "#стилизация", image: "/ban.png", link: "https://t.me/c/2055411531/11668" },
  { id: '38', title: "Конкурс", hashtag: "#конкурс", image: "/ban.png", link: "https://t.me/c/2249399970/31710" },
  { id: '39', title: "Ссылки на вещи", hashtag: "#ссылкинавещи", image: "/вещи.png", link: "https://t.me/c/2249399970/2" },
];

export default function Library() {
  const [activeTab, setActiveTab] = useState<"favorites" | "recent">("favorites");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  useEffect(() => {
    const savedFavs = localStorage.getItem("favorites");
    const savedRecent = localStorage.getItem("recent");
    if (savedFavs) {
        const favs = JSON.parse(savedFavs);
        setTimeout(() => setFavorites(favs), 0);
    }
    if (savedRecent) {
        const rec = JSON.parse(savedRecent);
        setTimeout(() => setRecent(rec), 0);
    }
  }, []);

  const toggleFavorite = (item: string) => {
    let newFavs;
    if (favorites.includes(item)) {
        newFavs = favorites.filter(i => i !== item);
    } else {
        newFavs = [...favorites, item];
    }
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.setItem("recent", JSON.stringify([]));
  };

  const handleMaterialClick = (materialTitle: string) => {
    let material = MATERIALS_DATA.find(m => m.title === materialTitle);
    
    // Fallback if not found in data
    if (!material) {
        material = {
            id: 'fallback-' + materialTitle.replace(/\s+/g, '-').toLowerCase(),
            title: materialTitle,
            hashtag: "#" + materialTitle.toLowerCase().replace(/\s/g, ''),
            image: "/ban.png", // placeholder
            link: "https://t.me/c/2055411531/1" // default placeholder link
        };
    }

    setSelectedMaterial(material);
    setActiveCategory(null); // Close category modal if open
    
    // Add to recent
    if (!recent.includes(material.title)) {
        const newRecent = [material.title, ...recent];
        setRecent(newRecent);
        localStorage.setItem("recent", JSON.stringify(newRecent));
    }
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
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Heart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Пока нет избранного</p>
                </div>
              ) : (
                favorites.map((item) => {
                  const material = MATERIALS_DATA.find(m => m.title === item);
                  return (
                    <div 
                        key={item} 
                        className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex gap-4 items-center group relative overflow-hidden cursor-pointer hover:border-pink-200 transition-colors"
                        onClick={() => handleMaterialClick(item)}
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gray-200 shrink-0 overflow-hidden relative">
                           <Image
                              src={material ? material.image : "/ban.png"}
                              alt="Preview"
                              fill
                              className="object-cover"
                           />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {material ? material.hashtag : "Материал"}
                              </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                              {item}
                          </h3>
                          <p className="text-[10px] text-gray-400">Нажмите для просмотра</p>
                      </div>
                      <button 
                          onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item);
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
                  {recent.length > 0 && (
                      <button onClick={clearRecent} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                          <Trash2 size={12} /> Очистить
                      </button>
                  )}
               </div>
               
               {recent.length > 0 ? (
                   <div className="space-y-6">
                       {recent.map((item, idx) => {
                         const material = MATERIALS_DATA.find(m => m.title === item);
                         return (
                            <div key={`${item}-${idx}`} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative group">
                                {/* Image Section */}
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={material ? material.image : "/ban.png"}
                                        alt={item}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                    
                                    {/* Favorite Button */}
                                    <button 
                                        onClick={() => toggleFavorite(item)}
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
                                            {material ? material.hashtag : "#материал"}
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
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => {
                                    if (cat.subCategories) {
                                        setActiveCategory(cat.name);
                                        setCategorySearchQuery("");
                                    } else {
                                        const material = MATERIALS_DATA.find(m => m.title === cat.name);
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

                    {CATEGORIES.find(c => c.name === activeCategory)?.subCategories
                        ?.filter(sub => {
                            const query = categorySearchQuery.toLowerCase();
                            if (!query) return true;
                            
                            const material = MATERIALS_DATA.find(m => m.title === sub);
                            const titleMatch = sub.toLowerCase().includes(query);
                            const hashtagMatch = material 
                                ? material.hashtag.toLowerCase().includes(query)
                                : ("#" + sub.toLowerCase().replace(/\s/g, '')).includes(query);
                                
                            return titleMatch || hashtagMatch;
                        })
                        .map((sub) => {
                         const material = MATERIALS_DATA.find(m => m.title === sub);
                         const displayImage = material ? material.image : "/ban.png";
                         const displayHashtag = material ? material.hashtag : "#" + sub.toLowerCase().replace(/\s/g, '');
                         const displayLink = material ? material.link : `https://t.me/c/2055411531/1`;

                         return (
                            <div key={sub} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative group">
                                {/* Image Section */}
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={displayImage}
                                        alt={sub}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                    
                                    {/* Favorite Button */}
                                    <button 
                                        onClick={() => toggleFavorite(sub)}
                                        className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors"
                                    >
                                        <Heart 
                                            size={20} 
                                            className={`transition-colors ${favorites.includes(sub) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
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
                    {(!CATEGORIES.find(c => c.name === activeCategory)?.subCategories) && (
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
                        onClick={() => toggleFavorite(selectedMaterial!.title)}
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
