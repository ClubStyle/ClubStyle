"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, HelpCircle, FileText, ExternalLink, ChevronRight, X, ChevronLeft } from "lucide-react";
import BottomNav from "../../components/BottomNav";

type CommunityTheme = { month: string; title: string };

type CommunityConfig = {
  themes: CommunityTheme[];
  chatUrl: string;
  supportUrl: string;
  privacyUrl: string;
  howItWorksTitle: string;
  howItWorksText: string;
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

function parseHowItWorksText(text: string) {
  const lines = (text || "").replace(/\r/g, "").split("\n");
  const blocks: Array<{ kind: "p"; text: string } | { kind: "ul"; items: string[] }> = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    const t = paragraph.join(" ").trim();
    paragraph = [];
    if (!t) return;
    blocks.push({ kind: "p", text: t });
  };

  const flushList = () => {
    const items = list.map((v) => v.trim()).filter(Boolean);
    list = [];
    if (!items.length) return;
    blocks.push({ kind: "ul", items });
  };

  for (const rawLine of lines) {
    const line = (rawLine || "").trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      continue;
    }
    if (list.length) flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

export default function Community() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const defaultConfig = useMemo<CommunityConfig>(() => {
    return {
      themes: [
        { month: "ЯНВАРЬ", title: "Вещи-инвестиции. Что купить сейчас и носить не один год" },
        { month: "ФЕВРАЛЬ", title: "Пережить зиму и полюбить свое отражение" },
        { month: "МАРТ", title: "Обновляемся без лишних трат" }
      ],
      chatUrl: "https://t.me/+hdjZRGlm5rA5NTBi",
      supportUrl: "https://t.me/ElennneHelp_bot",
      privacyUrl: "https://drive.google.com/file/d/1l8mYVAtxtbkdK1ep0ohYS6cFn6qc2IWC/view",
      howItWorksTitle: "Как все устроено",
      howItWorksText:
        "Друзья,\n\nУ нас в Клубе стильных много новеньких, и рада приветствовать вас в нашем стильном пространстве ❤️\n\nЧтобы вам было проще здесь ориентироваться, расскажу о том, как тут все устроено.\n\nКлуб стильных - это не только полезный канал со стильными идеями и полезной информацией, но еще и очень теплое сообщество единомышлениц, увлеченных стилем, которые общаются в нашем чате.\n\nВесь основной контент, который мы с командой готовим для вас 6 дней в неделю выходит здесь - в канале Клуба стильных.\n\nМои образы со ссылками на вещи, доступные к покупке в момент публикации, выходят в постах, отмеченных хэштегом #lookдняЛена.\n\nИногда я делюсь интересными находками, их можно найти по хэштегу #вещьдня.\n\nВ клубе есть система хэштегов, позволяющая быстро находить и другие посты или рубрики.\n\nПомимо канала у нас есть чат, который разделен на тематические ветки:\n\n- Болталка — здесь вы можете общаться, делиться советами, задавать вопросы и просто приятно проводить время с одноклубницами\n- #lookдня — чат, в котором вы делитесь своими образами\n- Вопросы и предложения — технический чат для организационных и технических вопросов, а также ваших предложений по работе Клуба стильных\n- Ссылки на находки — чат, в котором участницы делятся ссылками на свои находки\n- Навигация — здесь вы легко можете найти темы, которые ранее были в Клубе и быстро перейти к ним, а также обзоры брендов и записи прямых эфиров\n- Новости — в этом чате дублируем важные информационные сообщения и анонсы\n\nВ чате работают стилисты из моей команды — Люда и Света, они помогают отвечать на ваши вопросы с понедельника по пятницу.\n\nПо техническим вопросам вам всегда помогут в службе заботы @ElennneHelp_bot."
    };
  }, []);

  const [config, setConfig] = useState<CommunityConfig>(defaultConfig);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/materials?key=community&t=${Date.now()}`, { cache: "no-store" });
        const data = await readJson<unknown>(res);
        if (!res.ok) return;
        if (!data || typeof data !== "object") return;
        const record = data as Record<string, unknown>;
        const themesRaw = record.themes;
        const themes: CommunityTheme[] = Array.isArray(themesRaw)
          ? themesRaw
              .map((t) => t as Partial<CommunityTheme>)
              .map((t) => ({
                month: typeof t.month === "string" ? t.month.trim() : "",
                title: typeof t.title === "string" ? t.title.trim() : ""
              }))
              .filter((t) => t.month.length > 0 && t.title.length > 0)
          : [];
        const next: CommunityConfig = {
          themes: themes.length ? themes : defaultConfig.themes,
          chatUrl: typeof record.chatUrl === "string" && record.chatUrl.trim() ? record.chatUrl.trim() : defaultConfig.chatUrl,
          supportUrl:
            typeof record.supportUrl === "string" && record.supportUrl.trim()
              ? record.supportUrl.trim()
              : defaultConfig.supportUrl,
          privacyUrl:
            typeof record.privacyUrl === "string" && record.privacyUrl.trim()
              ? record.privacyUrl.trim()
              : defaultConfig.privacyUrl,
          howItWorksTitle:
            typeof record.howItWorksTitle === "string" && record.howItWorksTitle.trim()
              ? record.howItWorksTitle.trim()
              : defaultConfig.howItWorksTitle,
          howItWorksText:
            typeof record.howItWorksText === "string" && record.howItWorksText.trim()
              ? record.howItWorksText
              : defaultConfig.howItWorksText
        };
        if (!cancelled) setConfig(next);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [defaultConfig]);

  const howItWorksBlocks = useMemo(() => parseHowItWorksText(config.howItWorksText), [config.howItWorksText]);

  return (
    <div className="min-h-screen pb-24 font-sans bg-gray-50/50 relative">
      <div className="max-w-md mx-auto min-h-screen p-6">
        <div className="flex items-center gap-2 mb-8 pt-4">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
             <ChevronLeft size={24} />
          </Link>
          <Link href="/admin" className="block">
            <h1 className="text-3xl font-black uppercase tracking-wide text-gray-900">
              О КЛУБЕ
            </h1>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">
            Темы месяца
          </h2>
          <div className="space-y-3">
            {config.themes.map((theme, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-pink-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                <div className="relative z-10">
                  <div className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1">
                    {theme.month}
                  </div>
                  <div className="font-bold text-gray-900 leading-tight">
                    {theme.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">
            Поддержка
          </h2>
          <a
            href={config.supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Служба заботы</h3>
                <p className="text-xs text-blue-500 font-medium">{config.supportUrl}</p>
              </div>
              <ChevronRight className="ml-auto text-gray-300" size={20} />
            </div>
            <div className="text-xs text-gray-400 font-medium pl-14">
              пн-пт 10:00 - 19:00
            </div>
          </a>
        </div>

        <div className="space-y-3">
          <a
            href={config.chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <span className="font-bold text-gray-900">Чат клуба</span>
            <ExternalLink className="ml-auto text-gray-300" size={18} />
          </a>

          <button
            onClick={() => setIsHowItWorksOpen(true)}
            className="w-full flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-gray-900 block">{config.howItWorksTitle}</span>
              <span className="text-[10px] text-gray-400 block mt-1">Нажмите, чтобы прочитать</span>
            </div>
            <ChevronRight className="ml-auto text-gray-300" size={20} />
          </button>

          <a
            href={config.privacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-500 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span className="font-bold text-gray-900">Политика конфиденциальности</span>
            <ExternalLink className="ml-auto text-gray-300" size={18} />
          </a>
        </div>

        {isHowItWorksOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="font-bold text-lg">{config.howItWorksTitle}</h3>
                <button 
                  onClick={() => setIsHowItWorksOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="p-6 pb-16 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4">
                {howItWorksBlocks.map((b, idx) =>
                  b.kind === "ul" ? (
                    <ul key={idx} className="list-disc pl-5 space-y-2">
                      {b.items.map((it, j) => (
                        <li key={`${idx}-${j}`}>{it}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={idx} className={idx === 0 ? "font-medium text-gray-900" : undefined}>
                      {b.text}
                    </p>
                  )
                )}
                <div className="bg-blue-50 p-4 rounded-xl text-blue-800">
                  <p className="mb-2">
                    По техническим вопросам вам всегда помогут в службе заботы{" "}
                    <a
                      href={config.supportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline decoration-blue-300 underline-offset-2"
                    >
                      {config.supportUrl}
                    </a>
                  </p>
                  <p className="text-xs opacity-80">(срок ответа службы заботы до 24 часов с 10:00 до 19:00 МСК по будням)</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
