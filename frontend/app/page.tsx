"use client";

import Image, { type ImageProps } from "next/image";
import { Search, BookOpen, Heart, PlayCircle, ChevronLeft, ExternalLink } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { useState, useEffect, Suspense, useCallback } from "react";
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
  images?: string[];
  link: string;
  video_link?: string;
  description?: string;
  type?: string;
  image_position?: string;
  date?: number;
};

function SafeImage({
  src,
  alt,
  onError,
  ...props
}: Omit<ImageProps, "src"> & { src: ImageProps["src"] }) {
  const isUploads = typeof src === "string" && src.startsWith("/uploads/");
  const isWikimedia = typeof src === "string" && src.startsWith("https://upload.wikimedia.org/");
  const isTelegramFile = typeof src === "string" && src.startsWith("/api/telegram-file?");
  const isSupabaseFile = typeof src === "string" && src.startsWith("/api/supabase-file?");
  return (
    <Image
      {...props}
      src={src}
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

const DEFAULT_CATEGORIES: Category[] = [
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
  { name: "Верха", subCategories: ["Топ", "Футболка", "Лонгслив", "Майка", "Кардиган", "Жакет", "Жилет", "Блузка", "Рубашка", "Корсет", "Боди"] },
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
  { 
    name: "Советы",
    subCategories: ["Советы", "Стилизация"]
  },
  { name: "Покупки по миру" },
  { name: "Покупки по РФ" },
  { name: "Конкурс" },
  { name: "Гайды и чек-листы", hidden: true, subCategories: ["Новогодние образы"] },
  { 
    name: "Эфиры",
    hidden: true
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
  // removed duplicate hidden "Мои обучения"
];

const QUICK_FILTERS = [
    { label: "типы фигур", category: "Типы фигуры" },
    { label: "plus size", category: "Plus Size" },
    { label: "находки рф", category: "Покупки по РФ" },
    { label: "находки мир", category: "Покупки по миру" },
    { label: "обувь", category: "Обувь" },
    { label: "сумки", category: "#сумка" },
    { label: "верхняя одежда", category: "Верхняя одежда" },
    { label: "верха", category: "Верха" },
    { label: "низы", category: "Низы" },
    { label: "аксессуары", category: "Аксессуары" },
    { label: "образы участниц", category: "LINK:https://t.me/c/2249399970/230/33059" }
];

type CuratedItem = { title: string; hashtag: string; link: string; id: string };
type CuratedGroup = { group: string; items: CuratedItem[] };
const CURATED_TAGS: CuratedGroup[] = [
  {
    group: "Верхняя одежда",
    items: [
      { title: "Куртка", hashtag: "#куртка", link: "https://t.me/c/2055411531/13648", id: "13648" },
      { title: "Пальто", hashtag: "#пальто", link: "https://t.me/c/2055411531/13958", id: "13958" },
      { title: "Дубленка", hashtag: "#дубленка", link: "https://t.me/c/2055411531/14821", id: "14821" },
      { title: "Шуба", hashtag: "#шуба", link: "https://t.me/c/2055411531/5222", id: "5222" },
      { title: "Парка", hashtag: "#парка", link: "https://t.me/c/2055411531/12653", id: "12653" },
      { title: "Косуха", hashtag: "#косуха", link: "https://t.me/c/2055411531/11848", id: "11848" },
      { title: "Бомбер", hashtag: "#бомбер", link: "https://t.me/c/2055411531/12378", id: "12378" }
    ]
  },
  {
    group: "Верха",
    items: [
      { title: "Топ", hashtag: "#топ", link: "https://t.me/c/2055411531/14821", id: "14821" },
      { title: "Футболка", hashtag: "#футболка", link: "https://t.me/c/2055411531/14835", id: "14835" },
      { title: "Лонгслив", hashtag: "#лонгслив", link: "https://t.me/c/2055411531/13937", id: "13937" },
      { title: "Майка", hashtag: "#майка", link: "https://t.me/c/2055411531/11905", id: "11905" },
      { title: "Кардиган", hashtag: "#кардиган", link: "https://t.me/c/2055411531/14842", id: "14842" },
      { title: "Жакет", hashtag: "#жакет", link: "https://t.me/c/2055411531/14810", id: "14810" },
      { title: "Жилет", hashtag: "#жилет", link: "https://t.me/c/2055411531/12953", id: "12953" },
      { title: "Блузка", hashtag: "#блузка", link: "https://t.me/c/2055411531/13791", id: "13791" },
      { title: "Рубашка", hashtag: "#рубашка", link: "https://t.me/c/2055411531/13452", id: "13452" },
      { title: "Корсет", hashtag: "#корсет", link: "https://t.me/c/2055411531/11050", id: "11050" },
      { title: "Боди", hashtag: "#боди", link: "", id: "" }
    ]
  },
  {
    group: "Низы",
    items: [
      { title: "Брюки", hashtag: "#брюки", link: "https://t.me/c/2055411531/15042", id: "15042" },
      { title: "Юбка", hashtag: "#юбка", link: "https://t.me/c/2055411531/14930", id: "14930" },
      { title: "Джинсы", hashtag: "#джинсы", link: "https://t.me/c/2055411531/14732", id: "14732" },
      { title: "Шорты", hashtag: "#шорты", link: "https://t.me/c/2055411531/11269", id: "11269" },
      { title: "Бермуды", hashtag: "#бермуды", link: "https://t.me/c/2055411531/12394", id: "12394" },
      { title: "Легинсы", hashtag: "#легинсы", link: "https://t.me/c/2055411531/14753", id: "14753" },
      { title: "Комбинезон", hashtag: "#комбинезон", link: "https://t.me/c/2055411531/14778", id: "14778" },
      { title: "Платье", hashtag: "#платье", link: "https://t.me/c/2055411531/14802", id: "14802" }
    ]
  },
  {
    group: "Аксессуары",
    items: [
      { title: "Украшения", hashtag: "#украшения", link: "https://t.me/c/2055411531/14848", id: "14848" },
      { title: "Носки", hashtag: "#носки", link: "https://t.me/c/2055411531/11684", id: "11684" },
      { title: "Гольфы", hashtag: "#гольфы", link: "https://t.me/c/2055411531/13408", id: "13408" },
      { title: "Колготки", hashtag: "#колготки", link: "https://t.me/c/2055411531/14792", id: "14792" },
      { title: "Варежки", hashtag: "#варежки", link: "https://t.me/c/2055411531/14702", id: "14702" },
      { title: "Перчатки", hashtag: "#перчатки", link: "https://t.me/c/2055411531/15022", id: "15022" },
      { title: "Платок", hashtag: "#платок", link: "https://t.me/c/2055411531/12826", id: "12826" },
      { title: "Шапка", hashtag: "#шапка", link: "https://t.me/c/2055411531/14753", id: "14753" },
      { title: "Капор", hashtag: "#капор", link: "https://t.me/c/2055411531/13906", id: "13906" },
      { title: "Шарф", hashtag: "#шарф", link: "https://t.me/c/2055411531/14693", id: "14693" },
      { title: "Очки", hashtag: "#очки", link: "https://t.me/c/2055411531/13215", id: "13215" }
    ]
  },
  {
    group: "Сумки",
    items: [
      { title: "Сумка", hashtag: "#сумка", link: "https://t.me/c/2055411531/15325", id: "15325" }
    ]
  },
  {
    group: "Обувь",
    items: [
      { title: "Босоножки", hashtag: "#босоножки", link: "https://t.me/c/2055411531/14570", id: "14570" },
      { title: "Мюли", hashtag: "#мюли", link: "https://t.me/c/2055411531/11277", id: "11277" },
      { title: "Сабо", hashtag: "#сабо", link: "https://t.me/c/2055411531/10207", id: "10207" },
      { title: "Туфли", hashtag: "#туфли", link: "https://t.me/c/2055411531/14785", id: "14785" },
      { title: "Балетки", hashtag: "#балетки", link: "https://t.me/c/2055411531/14540", id: "14540" },
      { title: "Ботинки", hashtag: "#ботинки", link: "https://t.me/c/2055411531/13894", id: "13894" },
      { title: "Ботильоны", hashtag: "#ботильоны", link: "https://t.me/c/2055411531/13924", id: "13924" },
      { title: "Сапоги", hashtag: "#сапоги", link: "https://t.me/c/2055411531/14792", id: "14792" },
      { title: "Тапки", hashtag: "#тапки", link: "https://t.me/c/2055411531/14849", id: "14849" },
      { title: "Угги", hashtag: "#угги", link: "https://t.me/c/2055411531/6016", id: "6016" },
      { title: "Кеды", hashtag: "#кеды", link: "https://t.me/c/2055411531/11534", id: "11534" },
      { title: "Кроссовки", hashtag: "#кроссовки", link: "https://t.me/c/2055411531/10649", id: "10649" }
    ]
  },
  {
    group: "Купальники",
    items: [
      { title: "Купальники", hashtag: "#купальник", link: "https://t.me/c/2055411531/9790", id: "9790" }
    ]
  }
];

const LENA_LOOKS: MaterialItem[] = [
  {
    id: "15108",
    title: "Образ 1",
    hashtag: "#lookдняЛена",
    image: "/образ1.png",
    link: "https://t.me/c/2055411531/15108"
  },
  {
    id: "15073",
    title: "Образ 2",
    hashtag: "#lookдняЛена",
    image: "/образ2.png",
    link: "https://t.me/c/2055411531/15073"
  },
  {
    id: "14859",
    title: "Образ 3",
    hashtag: "#lookдняЛена",
    image: "/образ3.png",
    link: "https://t.me/c/2055411531/14859"
  },
  {
    id: "12245",
    title: "Образ 4",
    hashtag: "#lookдняЛена",
    image: "/образ4.png",
    link: "https://t.me/c/2055411531/12245"
  },
  {
    id: "12230",
    title: "Образ 5",
    hashtag: "#lookдняЛена",
    image: "/образ5.png",
    link: "https://t.me/c/2055411531/12230"
  }
];

const MENU_ITEMS = [
  { title: "ОБЗОРЫ БРЕНДОВ", image: "/obzorybrendov.png", category: "Бренды", count: 26 },
  { title: "ИДЕИ ОБРАЗОВ", image: "/ideiobrazov.png", category: "Идеи образов", count: 11 },
  { title: "#LOOKДНЯЛЕНА", image: "/obrazy.png", category: "#lookдняЛена", count: 5 },
  { title: "МАСТЕР-КЛАССЫ", image: "/masterklassy.png", category: "Мастер-классы", count: 99 },
  { title: "ГАЙДЫ", image: "/gaydy2.png", category: "Гайды и чек-листы", count: 2 },
  { title: "ЭФИРЫ", image: "/efiry2.png", category: "Эфиры", count: 3 },
  { title: "ОБУЧЕНИЯ", image: "/obucheniya.png", category: "Мои обучения", count: 53 },
  { title: "СОВЕТЫ И ЛАЙФХАКИ", image: "/sovetylayf.png", category: "Советы", count: 37 },
];

// Specific images for "Мои обучения"
const TRAINING_IMAGES: Record<string, string> = {
  "Гайд Базовый гардероб": "/baza.png",
  "Стилист будущего": "/stilist.png",
  "10 = 100": "/10-100.png",
  "Мастер-класс ПРОКАЧКА СТИЛЯ": "/prokachka.png",
  "Мастер-класс Тренды 2026": "/trendy.png",
  "УКРАШЕНИЯ: как выбирать, сочетать и хранить": "/ukrasheniya.png",
  "Чек-лист по ПОДБОРУ СУМОК": "/sumki.png"
};

const EDUCATION_LINKS: Record<string, string> = {
  "Гайд Базовый гардероб": "https://online.elennne.ru/gaid_base?utm_source=miniapp",
  "Базовый гардероб": "https://online.elennne.ru/gaid_base?utm_source=miniapp",
  "Стилист будущего": "https://elennne.ru/stylist-spec?utm_source=miniapp",
  "10 = 100": "https://elennne.ru/10clothes?utm_source=miniapp",
  "Мастер-класс ПРОКАЧКА СТИЛЯ": "https://elennne.ru/prokachkastilya?utm_source=miniappм",
  "Мастер-класс Тренды 2026": "https://elennne.ru/trends2026?utm_source=miniapp",
  "УКРАШЕНИЯ: как выбирать, сочетать и хранить": "https://elennne.ru/jewellery-check-list?utm_source=miniapp",
  "Чек-лист по ПОДБОРУ СУМОК": "https://elennne.ru/bags-check-list?utm_source=miniapp"
};

const FOOTWEAR_IMAGES: Record<string, string> = {
  "Обувь": "/bossoozhki.jpg",
  "Сапоги": "/sapogi.jpg",
  "Ботильоны": "/botilony.jpg",
  "Ботинки": "/botilony.jpg",
  "Мюли": "/bossoozhki.jpg",
  "Туфли": "/bossoozhki.jpg",
  "Босоножки": "/bossoozhki.jpg",
  "Тапки": "/bossoozhki.jpg",
  "Сабо": "/bossoozhki.jpg",
  "Балетки": "/bossoozhki.jpg",
  "Угги": "/sapogi.jpg",
  "Кеды": "/bossoozhki.jpg",
  "Кроссовки": "/bossoozhki.jpg"
};

const ACCESSORY_IMAGES: Record<string, string> = {
  "Украшения": "/ukrasheniya.jpg",
  "Носки": "/noski.jpg",
  "Гольфы": "/golfy.jpg",
  "Колготки": "/kolgotki.jpg",
  "Варежки": "/varezhki.jpg",
  "Перчатки": "/perchatki.jpg",
  "Платок": "/platok.jpg",
  "Шапка": "/shapka.jpg",
  "Капор": "/kapor.jpg",
  "Шарф": "/sharf.png",
  "Очки": "/ochki.png"
};

const BOTTOM_IMAGES: Record<string, string> = {
  "Брюки": "/bryuki.png",
  "Юбка": "/yubka.png",
  "Джинсы": "/dzhinsy.png",
  "Шорты": "/shorty.png",
  "Бермуды": "/bermudy.jpg",
  "Легинсы": "/leginsy.png",
  "Комбинезон": "/komb.png",
  "Платье": "/plate.png"
};

const TOP_IMAGES: Record<string, string> = {
  "Топ": "/top.png",
  "Футболка": "/futbolka.png",
  "Лонгслив": "/longsliv.png",
  "Майка": "/mayka.png",
  "Кардиган": "/kardigan.png",
  "Жакет": "/zhaket.png",
  "Жилет": "/zhilet.png",
  "Блузка": "/bluzka.png",
  "Рубашка": "/rubashka2.png",
  "Корсет": "/korset.png"
};

const BAG_IMAGES: Record<string, string> = {
  "Сумки": "/sumki.png"
};

// Map categories to curated tag groups shown inside their views
const CATEGORY_TO_GROUPS: Record<string, string[]> = {
  "Верха": ["Верха"],
  "Низы": ["Низы"],
  "Аксессуары": ["Аксессуары"],
  "Сумки": ["Сумки"],
  "Обувь": ["Обувь"],
  "Верхняя одежда": ["Верхняя одежда"],
  "Купальники": ["Купальники"]
};

const SUBCATEGORY_HASHTAG_OVERRIDES: Record<string, string> = {
  "Перевернутый треугольник": "#треугольник",
  "Сумки": "#сумка"
};

const SUBCATEGORY_QUERY_OVERRIDES: Record<string, string[]> = {
  "Перевернутый треугольник": ["треугольник"],
  "Сумки": ["сумка", "сумки"]
};

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
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subCategorySheet, setSubCategorySheet] = useState<{title: string, items: string[]} | null>(null);
  const [subCategorySearchQuery, setSubCategorySearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem("favorites") : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem("recent") : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [tgUser, setTgUser] = useState<{first_name: string, photo_url?: string} | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const handleItemClick = useCallback((item: string | MaterialItem) => {
    let material: MaterialItem | undefined;

    if (typeof item === 'string') {
        material = materials.find(m => m.title === item);
    } else {
        material = item;
    }

    if (!material) {
      const title = typeof item === "string" ? item : item.title;
      material = {
        id: `fallback_${title.toLowerCase().replace(/\s/g, "_")}`,
        title: title,
        hashtag: "#" + title.toLowerCase().replace(/\s/g, ""),
        image: "/ban.png",
        link: "https://t.me/c/2055411531/1"
      };
    }
    setSelectedMaterial(material);
    
    const title = material.title;
    if (!recent.includes(title)) {
        const newRecent = [title, ...recent.filter(i => i !== title)].slice(0, 20);
        setRecent(newRecent);
        localStorage.setItem("recent", JSON.stringify(newRecent));
    }
  }, [materials, recent]);

  const handleCategoryClick = useCallback((category: Category) => {
    if (category.subCategories) {
      setActiveCategory(category.name);
      setSubCategorySheet({
        title: category.name,
        items: category.subCategories
      });
    } else {
      // Try to find items by hashtag if no subcategories (e.g. "Разборы образов")
      const query = category.name.toLowerCase().replace(/\s/g, '');
      console.log(`Filtering for category: ${category.name} (query: ${query})`);
      
      if (category.name === "#lookдняЛена") {
        setActiveCategory(category.name);
        setSubCategorySheet({
          title: category.name,
          items: LENA_LOOKS.map((m) => m.title)
        });
        return;
      }

      const relatedMaterials = materials.filter(m => 
          m.hashtag.toLowerCase().includes(query) || 
          m.hashtag.toLowerCase().includes("#" + query) ||
          (category.name === "Разборы образов" && (m.hashtag.includes("#разборобразов") || m.hashtag.includes("#лукдня"))) ||
          (category.name === "Мастер-классы" && (m.hashtag.includes("#мастеркласс") || m.hashtag.includes("#мастер-класс"))) ||
          (category.name === "Эфиры" && m.hashtag.includes("#эфир")) ||
          (category.name === "Бренды" && m.hashtag.includes("#обзорыбрендов")) ||
          (category.name === "Гайды и чек-листы" && (m.hashtag.includes("#гайд") || (typeof m.link === "string" && m.link.toLowerCase().endsWith(".pdf")))) ||
          (category.name === "Покупки по миру" && m.hashtag.toLowerCase().includes("#покупкипомиру")) ||
          (category.name === "Покупки по РФ" && m.hashtag.toLowerCase().includes("#покупкивроссии")) ||
          (category.name === "Идеи образов" &&
            (m.hashtag.toLowerCase().includes("#идеиобразов") ||
              m.hashtag.toLowerCase().includes("#образ") ||
              m.hashtag.toLowerCase().includes("#образы") ||
              m.hashtag.toLowerCase().includes("#lookднялена")) &&
            m.link !== "https://t.me/c/2055411531/15199" &&
            m.id !== "15199" &&
            !(typeof m.link === "string" && m.link.toLowerCase().endsWith(".pdf")))
      );
      
      console.log(`Found ${relatedMaterials.length} items for ${category.name}`);

      if (relatedMaterials.length > 0) {
           const monthIndex = (text: string) => {
               const t = text.toLowerCase();
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
           };
           const extractYear = (text: string) => {
               const m = text.match(/(20\d{2})/g);
               if (!m || m.length === 0) return 0;
               const last = m[m.length - 1] || "";
               const y = Number(last);
               return Number.isFinite(y) ? y : 0;
           };
           const sorted =
               category.name === "Бренды"
                   ? [...relatedMaterials].sort((a, b) => {
                         const ay = extractYear(a.title);
                         const by = extractYear(b.title);
                         if (ay !== by) return by - ay;
                         const am = monthIndex(a.title);
                         const bm = monthIndex(b.title);
                         if (am !== bm) return bm - am;
                         return (b.date || 0) - (a.date || 0);
                     })
                   : relatedMaterials;
           setActiveCategory(category.name);
           setSubCategorySheet({
               title: category.name,
               items: sorted.map(m => m.title)
           });
           return;
      }

      const material = materials.find(m => m.title === category.name);
      if (material) {
          handleItemClick(material);
      } else {
          setActiveCategory(category.name);
          console.log("Selected:", category.name);
      }
    }
  }, [materials, handleItemClick]);
  useEffect(() => {
    // Handle URL params for direct category access
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
        const category = categories.find(c => c.name === categoryParam);
        if (category) {
            setTimeout(() => handleCategoryClick(category), 0);
        }
    }
  }, [categories, searchParams, handleCategoryClick]);


  useEffect(() => {
    // Fetch materials from API
    console.log("Fetching materials...");
    fetch(`/api/materials?t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
            console.log("Received materials count:", Array.isArray(data) ? data.length : 0);
            if (Array.isArray(data)) {
                const items = data as unknown as MaterialItem[];
                const dayKey = (ts?: number) => ts ? new Date(ts * 1000).toISOString().slice(0, 10) : '';
                const isChannelPost = (m: MaterialItem) => {
                    const hasTgLink = typeof m.link === 'string' && /^https?:\/\/t\.me\/c\/2055411531\/\d+/.test(m.link);
                    const isNumeric = /^\d+$/.test(m.id);
                    return hasTgLink && isNumeric;
                };
                const byDay = new Map<string, MaterialItem[]>();
                for (const m of items) {
                    const key = dayKey(m.date);
                    if (!key) continue;
                    const list = byDay.get(key) || [];
                    list.push(m);
                    byDay.set(key, list);
                }
                const merged: MaterialItem[] = [];
                const consumed = new Set<string>();
                const mergedSingles = new Set<string>();
                for (const list of byDay.values()) {
                    const anchors = list
                        .filter(m => (m.description && m.description.trim().length > 0) && isChannelPost(m))
                        .sort((a, b) => (a.date || 0) - (b.date || 0));
                    const singles = list
                        .filter(m => ((!m.description || m.description.trim().length === 0)) && isChannelPost(m))
                        .sort((a, b) => (a.date || 0) - (b.date || 0));
                    for (const anchor of anchors) {
                        const imgs: string[] = [];
                        if (anchor.images?.length) imgs.push(...anchor.images);
                        if (anchor.image && anchor.image !== '/ban.png') imgs.push(anchor.image);
                        const tags = new Set<string>();
                        (anchor.hashtag || '').split(' ').forEach(t => t && tags.add(t));
                        const baseTs = anchor.date || 0;
                        const nearbySingles = singles.filter((s) => {
                            if (mergedSingles.has(s.id)) return false;
                            if (Math.abs((s.date || 0) - baseTs) > 120) return false;
                            const sTags = (s.hashtag || "")
                              .split(" ")
                              .map((t) => t.trim())
                              .filter(Boolean);
                            return sTags.some((t) => t !== "#новинка" && tags.has(t));
                        });
                        for (const s of nearbySingles) {
                            if (s.image && s.image !== '/ban.png') imgs.push(s.image);
                            (s.hashtag || '').split(' ').forEach(t => t && tags.add(t));
                            mergedSingles.add(s.id);
                        }
                        const mergedItem: MaterialItem = {
                            id: anchor.id,
                            title: anchor.title || "Новый пост",
                            hashtag: Array.from(tags).join(' ') || '#новинка',
                            image: imgs[0] || anchor.image,
                            images: Array.from(new Set(imgs)),
                            link: anchor.link,
                            video_link: anchor.video_link,
                            description: anchor.description,
                            date: anchor.date
                        };
                        merged.push(mergedItem);
                        consumed.add(anchor.id);
                    }
                }
                const rest = items.filter(m => !consumed.has(m.id))
                    .filter(m => !(m.title === 'Новый пост' && m.image === '/ban.png' && (!m.description || m.description.trim() === '')));
                setMaterials([...merged, ...rest].sort((a, b) => (b.date || 0) - (a.date || 0)));
            }
        })
        .catch(err => console.error("Failed to fetch materials:", err));

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
    
    

    type TgWindow = {
        Telegram?: {
            WebApp?: {
                ready: () => void;
                initDataUnsafe?: { user?: { first_name: string; photo_url?: string } };
            };
        };
    };
    if (typeof window !== 'undefined' && (window as unknown as TgWindow).Telegram?.WebApp) {
        const tg = (window as unknown as TgWindow).Telegram!.WebApp!;
        tg.ready();
        if (tg.initDataUnsafe?.user) {
            setTimeout(() => setTgUser(tg.initDataUnsafe!.user!), 0);
        }
    }
  }, []);

  const openExternalLink = (url: string) => {
    const u = (url || "").trim();
    if (!u) return;
    const w = window as unknown as {
      Telegram?: {
        WebApp?: {
          openLink?: (url: string) => void;
          openTelegramLink?: (url: string) => void;
        };
      };
    };
    const tg = w.Telegram?.WebApp;
    if (tg?.openTelegramLink && /^https?:\/\/t\.me\//.test(u)) {
      tg.openTelegramLink(u);
      return;
    }
    if (tg?.openLink) {
      tg.openLink(u);
      return;
    }
    window.open(u, "_blank", "noopener,noreferrer");
  };

  const buildTelegramChannelSearchUrl = (rawQuery: string) => {
    const q = (rawQuery || "").trim();
    if (!q) return "";
    const sampleLink =
      materials.find((m) => typeof m.link === "string" && m.link.includes("https://t.me/"))
        ?.link || "https://t.me/c/2055411531";
    try {
      const url = new URL(sampleLink);
      const parts = url.pathname.split("/").filter(Boolean);
      let basePath = "";
      if (parts[0] === "c" && parts[1]) basePath = `/c/${parts[1]}`;
      else if (parts[0]) basePath = `/${parts[0]}`;
      else return "";
      const out = new URL(url.origin + basePath);
      out.searchParams.set("q", q);
      return out.toString();
    } catch {
      return "";
    }
  };

  const openTelegramChannelSearch = (rawQuery: string, fallbackPostId?: string) => {
    const searchUrl = buildTelegramChannelSearchUrl(rawQuery);
    const w = window as unknown as {
      Telegram?: {
        WebApp?: {
          openLink?: (url: string) => void;
          openTelegramLink?: (url: string) => void;
          platform?: string;
        };
      };
    };
    const tg = w.Telegram?.WebApp;
    const postId = (fallbackPostId || "").trim();
    const postUrl = postId && /^\d+$/.test(postId) ? `https://t.me/c/2055411531/${postId}` : "";
    const platform = (tg?.platform || "").toLowerCase();
    const canOpenSearchInApp = platform === "android" || platform === "ios";
    if (postUrl) {
      openExternalLink(postUrl);
      return;
    }
    if (canOpenSearchInApp && tg?.openTelegramLink && searchUrl) {
      tg.openTelegramLink(searchUrl);
      return;
    }
    if (tg?.openTelegramLink && searchUrl) {
      tg.openTelegramLink(searchUrl);
      return;
    }
    const q = (rawQuery || "").trim();
    const tag = q.startsWith("#") ? q : `#${q}`;
    const preferLocal = !canOpenSearchInApp || !tg?.openTelegramLink;
    if (preferLocal) {
      const items = materials
        .filter((m) => {
          const h = (m.hashtag || "").toLowerCase();
          const d = (m.description || "").toLowerCase();
          return h.includes(tag.toLowerCase()) || d.includes(q.toLowerCase());
        })
        .sort((a, b) => (b.date || 0) - (a.date || 0))
        .map((m) => m.title);
      setSubCategorySheet({ title: tag, items });
      setActiveCategory(tag);
      return;
    }
    if (searchUrl) openExternalLink(searchUrl);
  };

  const toggleFavorite = (e: React.MouseEvent, itemKey: string) => {
    e.stopPropagation();
    let key = itemKey;
    const material = materials.find(m => m.id === itemKey || m.title === itemKey);
    if (material) key = material.id;
    const exists = favorites.includes(key);
    const newFavs = exists ? favorites.filter(i => i !== key) : [...favorites, key];
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
  };


  const handleHashtagClick = (hashtag: string) => {
    const normalized = (hashtag || "").trim();
    const tag = normalized.startsWith("#") ? normalized : `#${normalized}`;
    const tagLower = tag.toLowerCase();
    const items = materials
      .filter((m) => {
        const h = (m.hashtag || "").toLowerCase();
        const d = (m.description || "").toLowerCase();
        return h.includes(tagLower) || d.includes(tagLower);
      })
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .map((m) => m.title);
    setSubCategorySheet({
        title: tag,
        items: items
    });
    setActiveCategory(tag);
  };

  const filteredMaterials = searchQuery 
      ? materials.filter(m => 
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          m.hashtag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  const foundSubCategories = searchQuery
      ? categories.flatMap(cat => 
          (cat.subCategories || [])
            .filter(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(sub => ({ sub, parent: cat }))
        )
      : [];

  const [feedCount, setFeedCount] = useState(20);


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

        {/* Навигацию по тегам переносим внутрь страниц категорий */}
        {/* Grid Navigation (Replaces Banner and Carousel) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
            {MENU_ITEMS.map((item, index) => (
                <button 
                    key={index}
                    onClick={() => {
                        const cat = categories.find(c => c.name === item.category);
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
                            if (item.category.startsWith("LINK:")) {
                                openExternalLink(item.category.replace("LINK:", ""));
                                return;
                            }
                            if (item.category.startsWith("TGSEARCH:")) {
                                const q = item.category.replace("TGSEARCH:", "");
                                const fallbackPostId =
                                  q.toLowerCase() === "сумки"
                                    ? CURATED_TAGS.find((g) => g.group === "Сумки")?.items?.[0]?.id
                                    : undefined;
                                openTelegramChannelSearch(q, fallbackPostId);
                                return;
                            }
                            if (item.category.trim().startsWith("#")) {
                                handleHashtagClick(item.category.trim());
                                return;
                            }
                            const cat = categories.find(c => c.name === item.category);
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
                        {item.label.startsWith("#") ? item.label.slice(1) : item.label}
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
                                        <SafeImage src={item.image} alt={item.title} fill className="object-cover" />
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
            Лента новостей
          </h2>
          
          <div className="space-y-4">
            {materials.length > 0 ? (
                materials
                .filter((m) => {
                    const isChannelLink = typeof m.link === 'string' && /^https?:\/\/t\.me\/c\/2055411531\/\d+/.test(m.link);
                    const isNumericId = /^\d+$/.test(m.id);
                    return isChannelLink && isNumericId;
                })
                .sort((a, b) => Number(b.id) - Number(a.id))
                .slice(0, feedCount)
                .map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedMaterial(item)}
                        className="block bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-lg border border-white/50 transition-transform active:scale-95 cursor-pointer"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-semibold text-gray-400">
                                {item.hashtag?.toLowerCase().includes('#эфир')
                                  ? 'ранее проходил'
                                  : (item.date ? new Date(item.date * 1000).toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Новое')}
                            </span>
                            <div className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
                        </div>
                        
                        { (item.images?.length || 0) > 0 ? (
                            <div className="w-full h-80 bg-gray-100 rounded-2xl overflow-hidden relative mb-4 border border-gray-100">
                                <SafeImage
                                    src={item.images![0]} 
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleFavorite(e, item.id);
                                    }}
                                    className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors z-10"
                                >
                                    <Heart 
                                        size={20} 
                                        className={`transition-colors ${favorites.includes(item.id) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                                    />
                                </button>
                            </div>
                        ) : item.image && item.image !== '/ban.png' && (
                            <div className="w-full h-80 bg-gray-100 rounded-2xl overflow-hidden relative mb-4 border border-gray-100">
                                <SafeImage
                                    src={item.image} 
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                />
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleFavorite(e, item.id);
                                    }}
                                    className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors z-10"
                                >
                                    <Heart 
                                        size={20} 
                                        className={`transition-colors ${favorites.includes(item.id) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
                                    />
                                </button>
                            </div>
                        )}

                        <div className="text-xs text-gray-800 font-medium mb-4 leading-relaxed whitespace-pre-wrap line-clamp-6">
                            {item.description || item.title}
                        </div>

                        {item.hashtag && (
                            <div className="flex flex-wrap gap-2">
                                {item.hashtag.split(' ').map((tag, i) => (
                                    <button 
                                        key={i} 
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
                        )}
                    </div>
                ))
            ) : (
                 <div className="text-center text-gray-400 text-sm py-4">
                     Загрузка...
                 </div>
            )}
          </div>
          {materials.filter((m) => {
            const isChannelLink = typeof m.link === 'string' && /^https?:\/\/t\.me\/c\/2055411531\/\d+/.test(m.link);
            const isNumericId = /^\d+$/.test(m.id);
            return isChannelLink && isNumericId;
          }).length > feedCount && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setFeedCount(feedCount + 20)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Показать ещё
              </button>
            </div>
          )}
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
                    <h3 className="text-xl font-black uppercase tracking-wide flex-1">{subCategorySheet.title}</h3>
                    {subCategorySheet.title?.trim().startsWith("#") && (
                      <button
                        onClick={() => {
                          openTelegramChannelSearch(subCategorySheet.title);
                        }}
                        className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-1 rounded-lg hover:bg-pink-100 transition-colors flex items-center gap-1"
                      >
                        <Search size={14} />
                        TG поиск
                      </button>
                    )}
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

                {/* Встроенные группы тегов для выбранной категории */}
                {(() => {
                  const catGroups: string[] = activeCategory ? (CATEGORY_TO_GROUPS[activeCategory] || []) : [];
                  return catGroups.length > 0;
                })() && (
                  <div className="space-y-6">
                    {((activeCategory ? (CATEGORY_TO_GROUPS[activeCategory] || []) : [])).map((grpName: string) => {
                      const grp = CURATED_TAGS.find((g) => g.group === grpName);
                      if (!grp) return null;
                      const firstHashtag = (grp.items.find((it) => (it.hashtag || "").trim().startsWith("#"))?.hashtag || "").trim();
                      return (
                        <div key={grpName}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-bold text-gray-900">{grp.group}</div>
                            <button
                              onClick={() => openTelegramChannelSearch(firstHashtag || grp.group)}
                              className="text-[10px] font-bold text-pink-500 bg-pink-50 px-3 py-1 rounded-lg hover:bg-pink-100 transition-colors"
                            >
                              Открыть пост
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {grp.items.map((it, idx) => (
                              <button
                                key={`${grp.group}-${it.hashtag}-${idx}`}
                                onClick={() => handleHashtagClick(it.hashtag)}
                                className="whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-700 border border-gray-100 shadow-sm hover:bg-gray-50 hover:border-pink-200 transition-all"
                              >
                                {it.hashtag}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {subCategorySheet.items
                    .filter(item => {
                        const query = subCategorySearchQuery.toLowerCase();
                        if (!query) return true;
                        
                        const material =
                          activeCategory === "#lookдняЛена"
                            ? LENA_LOOKS.find((m) => m.title === item)
                            : materials.find((m) => m.title === item);
                        const titleMatch = item.toLowerCase().includes(query);
                        const overrideHashtag = SUBCATEGORY_HASHTAG_OVERRIDES[item];
                        const fallbackHashtag = overrideHashtag
                            ? (overrideHashtag.startsWith("#") ? overrideHashtag : `#${overrideHashtag}`)
                            : ("#" + item.toLowerCase().replace(/\s/g, ''));
                        const hashtagMatch = material
                            ? material.hashtag.toLowerCase().includes(query)
                            : fallbackHashtag.toLowerCase().includes(query);
                            
                        return titleMatch || hashtagMatch;
                    })
                    .map((item) => {
                         const material =
                          activeCategory === "#lookдняЛена"
                            ? LENA_LOOKS.find((m) => m.title === item)
                            : materials.find((m) => m.title === item);
                         const categoryItem = categories.find(c => c.name === item && c.subCategories);

                        const displayImage = activeCategory === "Мои обучения"
                            ? (TRAINING_IMAGES[item] ?? (material ? material.image : "/ban.png"))
                            : activeCategory === "Обувь"
                              ? (FOOTWEAR_IMAGES[item] ?? (material ? material.image : "/ban.png"))
                              : activeCategory === "Аксессуары"
                                ? (ACCESSORY_IMAGES[item] ?? (material ? material.image : "/ban.png"))
                                : activeCategory === "Низы"
                                  ? (BOTTOM_IMAGES[item] ?? (material ? material.image : "/ban.png"))
                                  : activeCategory === "Верха"
                                    ? (TOP_IMAGES[item] ?? (material ? material.image : "/ban.png"))
                                    : activeCategory === "Сумки"
                                      ? (BAG_IMAGES[item] ?? (material ? material.image : "/ban.png"))
                                : (material ? material.image : "/ban.png");
                        const overrideHashtag = SUBCATEGORY_HASHTAG_OVERRIDES[item];
                        const fallbackHashtag = overrideHashtag
                          ? (overrideHashtag.startsWith("#") ? overrideHashtag : `#${overrideHashtag}`)
                          : "#" + item.toLowerCase().replace(/\s/g, '');
                        const displayHashtag = material ? material.hashtag : fallbackHashtag;

                        const handleCardClick = () => {
                            const eduLink = EDUCATION_LINKS[item];
                            if (eduLink) {
                                openExternalLink(eduLink);
                                return;
                            }
                            if (activeCategory === "Советы" && item === "Советы") {
                                openExternalLink("https://t.me/c/2055411531/14959");
                                return;
                            }
                            if (activeCategory === "Советы" && item === "Стилизация") {
                                openExternalLink("https://t.me/c/2055411531/13835");
                                return;
                            }
                            if (categoryItem) {
                                handleCategoryClick(categoryItem);
                                return;
                            }
                            if (activeCategory === "#lookдняЛена" && material) {
                                const found =
                                  materials.find(
                                    (m) => m.id === material.id || m.link === material.link
                                  ) || material;
                                handleItemClick(found);
                                return;
                            }

                            const resolvedHashtag = overrideHashtag
                              ? (overrideHashtag.startsWith("#") ? overrideHashtag : `#${overrideHashtag}`)
                              : "#" + item.toLowerCase().replace(/\s/g, '');
                            const baseQuery = resolvedHashtag.slice(1).toLowerCase();
                            const queries = (SUBCATEGORY_QUERY_OVERRIDES[item] && SUBCATEGORY_QUERY_OVERRIDES[item].length
                              ? SUBCATEGORY_QUERY_OVERRIDES[item]
                              : [baseQuery]
                            ).map((q) => (q || "").toLowerCase()).filter(Boolean);
                            const isRootSheet = subCategorySheet.title === (activeCategory || "");
                            const preferAuto =
                                activeCategory === "Обувь" ||
                                activeCategory === "Аксессуары" ||
                                activeCategory === "Низы" ||
                                activeCategory === "Верха" ||
                                activeCategory === "Сумки";

                            if (isRootSheet && activeCategory === "Советы" && item === "Советы") {
                                const relatedMaterials = materials
                                  .filter((m) => {
                                    const h = (m.hashtag || "").toLowerCase();
                                    return queries.some((q) => h.includes(q) || h.includes("#" + q));
                                  })
                                  .filter(m => !m.id.startsWith('edu_') && !m.hashtag.toLowerCase().includes('#обучение'));

                                if (relatedMaterials.length === 1) {
                                    handleItemClick(relatedMaterials[0]);
                                    return;
                                }

                                if (relatedMaterials.length > 1) {
                                    setSubCategorySheet({
                                        title: item,
                                        items: relatedMaterials.map(m => m.title)
                                    });
                                    return;
                                }
                            }

                            if (isRootSheet && preferAuto) {
                                const relatedMaterials = materials
                                  .filter((m) => {
                                    const h = (m.hashtag || "").toLowerCase();
                                    return queries.some((q) => h.includes(q) || h.includes("#" + q));
                                  })
                                  .filter(m => !m.id.startsWith('edu_') && !m.hashtag.toLowerCase().includes('#обучение'));

                                if (relatedMaterials.length === 1) {
                                    handleItemClick(relatedMaterials[0]);
                                    return;
                                }

                                if (relatedMaterials.length > 1) {
                                    setSubCategorySheet({
                                        title: item,
                                        items: relatedMaterials.map(m => m.title)
                                    });
                                    return;
                                }
                            }

                            const curatedGroup = CURATED_TAGS.find(g => g.group === (activeCategory || ""));
                            const curatedItem = curatedGroup ? curatedGroup.items.find(it => it.title === item) : null;
                            if (curatedItem) {
                                handleHashtagClick(curatedItem.hashtag);
                                return;
                            }

                            // Logic to handle "folders" of materials (same hashtag)
                            // Check if we are not already inside this folder
                            if (subCategorySheet.title !== item) {
                                 // Find materials that match this item as a hashtag
                                 const relatedMaterials = materials
                                   .filter((m) => {
                                     const h = (m.hashtag || "").toLowerCase();
                                     return queries.some((q) => h.includes(q) || h.includes("#" + q));
                                   })
                                   .filter(m => !m.id.startsWith('edu_') && !m.hashtag.toLowerCase().includes('#обучение'));
                                 
                                 if (relatedMaterials.length === 1) {
                                      handleItemClick(relatedMaterials[0]);
                                      return;
                                 }

                                 if (relatedMaterials.length > 1) {
                                      setSubCategorySheet({
                                          title: item, // Keep title same as item name to prevent re-opening on click
                                          items: relatedMaterials.map(m => m.title)
                                      });
                                      return;
                                 }
                            }
                            handleItemClick(item);
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
                                         {material?.description?.replace(/(?:^|\s)(#[a-zA-Zа-яА-Я0-9_]+)/g, '').trim()}
                                     </div>
                                </div>
                             );
                        }

                        return (
                        <div key={item} onClick={handleCardClick} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative group cursor-pointer active:scale-[0.98] transition-transform">
                             {/* Image Section */}
                             <div className="relative h-48 w-full bg-white flex items-center justify-center">
                                 <SafeImage
                                     src={displayImage}
                                     alt={item}
                                     fill
                                    className={`object-contain ${material?.image_position || "object-center"}`}
                                />
                                 
                                 {/* Favorite Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(e, material?.id ?? item);
                                    }}
                                    className="absolute top-4 right-4 bg-white/30 backdrop-blur-md p-2 rounded-full hover:bg-white transition-colors"
                                >
                                    <Heart 
                                        size={20} 
                                        className={`transition-colors ${favorites.includes(material?.id ?? item) ? "fill-pink-500 text-pink-500" : "text-white"}`} 
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
                                 {(() => {
                                  if (activeCategory === "Мои обучения" || activeCategory === "Гайды и чек-листы" || activeCategory === "Мастер-классы") {
                                       return (
                                           <div className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap font-medium mb-3 line-clamp-4">
                                               {material?.description?.replace(/(?:^|\s)(#[a-zA-Zа-яА-Я0-9_]+)/g, '').trim()}
                                           </div>
                                       );
                                   }
                                   /* Description hidden as requested for other categories */
                                   return null;
                               })()}
                                
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
                        selectedMaterial.hashtag?.toLowerCase().includes('#эфир') ? 'aspect-[16/9]' : 'aspect-auto'
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
                                <SafeImage
                                    src={
                                      selectedMaterial.hashtag?.toLowerCase().includes("#эфир")
                                        ? (selectedMaterial.image && selectedMaterial.image !== "/ban.png"
                                            ? selectedMaterial.image
                                            : (selectedMaterial.images?.[0] || selectedMaterial.image))
                                        : (selectedMaterial.images?.[0] || selectedMaterial.image)
                                    }
                                    alt={selectedMaterial.title}
                                    {...(selectedMaterial.hashtag?.toLowerCase().includes('#эфир')
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
                            {(() => {
                                const text = selectedMaterial.description.replace(/(?:^|\s)(#[a-zA-Zа-яА-Я0-9_]+)/g, '').trim();
                                const isBrand = selectedMaterial.hashtag?.includes("#обзорыбрендов");
                                if (isBrand) {
                                    const firstPara = text.split(/\n\s*\n/)[0] || text;
                                    return firstPara;
                                }
                                return text;
                            })()}
                        </div>
                    )}

                    {typeof selectedMaterial.link === 'string' && selectedMaterial.link.toLowerCase().endsWith('.pdf') && (
                        <div className="mb-8">
                            <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                                <iframe
                                    src={`${selectedMaterial.link}#toolbar=1&navpanes=0`}
                                    className="w-full h-[70vh]"
                                />
                            </div>
                        </div>
                    )}

                    {(() => {
                      const isBrand = selectedMaterial.hashtag?.includes("#обзорыбрендов");
                      const imgs = selectedMaterial.images || [];
                      if (isBrand || imgs.length <= 1) return null;
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          {imgs.slice(1).map((img, idx) => (
                            <div key={idx} className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                              <SafeImage src={img} alt={`${selectedMaterial.title} ${idx+2}`} width={600} height={600} className="w-full h-auto object-cover" />
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {selectedMaterial.hashtag?.includes("#обзорыбрендов") &&
                      typeof selectedMaterial.link === "string" &&
                      selectedMaterial.link.trim() && (
                        <div className="mt-6">
                          <a
                            href={selectedMaterial.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center bg-pink-50 text-pink-600 font-bold px-4 py-3 rounded-xl border border-pink-200 hover:bg-pink-100 transition-colors"
                          >
                            Смотреть полный пост в канале клуба
                          </a>
                        </div>
                      )}
                </div>
            </div>

            {/* Fixed Bottom Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 pb-8 z-20">
                 <div className="flex flex-col gap-3 max-w-md mx-auto">
                      <button 
                          onClick={(e) => toggleFavorite(e, selectedMaterial.id)}
                          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all border ${
                              favorites.includes(selectedMaterial.id)
                                  ? "bg-pink-50 border-pink-200 text-pink-500"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                          <Heart size={20} className={favorites.includes(selectedMaterial.id) ? "fill-current" : ""} />
                          {favorites.includes(selectedMaterial.id) ? "В избранном" : "Добавить в избранное"}
                      </button>

                      {selectedMaterial.video_link && (
                          <button
                              onClick={() => openExternalLink(selectedMaterial.video_link!)}
                              className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                          >
                              <PlayCircle size={20} />
                              Смотреть запись
                          </button>
                      )}

                      {(() => {
                        const rawLink = typeof selectedMaterial.link === "string" ? selectedMaterial.link : "";
                        const link = rawLink.trim();
                        const resolved = link.toLowerCase().endsWith(".pdf") ? link : link;
                        const eduLink = EDUCATION_LINKS[selectedMaterial.title];
                        const url = (eduLink || resolved).trim();
                        if (!url) return null;
                        return (
                          <button
                            onClick={() => openExternalLink(url)}
                            className="w-full bg-pink-500 text-white font-bold py-3.5 rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                          >
                            <ExternalLink size={20} />
                            {typeof selectedMaterial.link === "string" &&
                            selectedMaterial.link.toLowerCase().endsWith(".pdf")
                              ? "Открыть PDF"
                              : (selectedMaterial.id.startsWith("edu_")
                                  ? "Смотреть"
                                  : (selectedMaterial.hashtag?.includes("#обзорыбрендов")
                                      ? "Смотреть полный пост в канале клуба"
                                      : "Перейти к оригинальному посту"))}
                          </button>
                        );
                      })()}
                 </div>
            </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
