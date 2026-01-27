"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageCircle, HelpCircle, FileText, ExternalLink, ChevronRight, X, ChevronLeft } from "lucide-react";
import BottomNav from "../../components/BottomNav";

export default function Community() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const THEMES = [
    { month: "ЯНВАРЬ", title: "Вещи-инвестиции. Что купить сейчас и носить не один год" },
    { month: "ФЕВРАЛЬ", title: "Пережить зиму и полюбить свое отражение" },
    { month: "МАРТ", title: "Обновляемся без лишних трат" },
  ];

  return (
    <div className="min-h-screen pb-24 font-sans bg-gray-50/50 relative">
      <div className="max-w-md mx-auto min-h-screen p-6">
        <div className="flex items-center gap-2 mb-8 pt-4">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
             <ChevronLeft size={24} />
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-wide text-gray-900">
            О КЛУБЕ
          </h1>
        </div>

        {/* Themes Section */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">
            Темы месяца
          </h2>
          <div className="space-y-3">
            {THEMES.map((theme, idx) => (
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

        {/* Support Service */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 pl-1">
            Поддержка
          </h2>
          <a
            href="https://t.me/ElennneHelp_bot"
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
                <p className="text-xs text-blue-500 font-medium">@ElennneHelp_bot</p>
              </div>
              <ChevronRight className="ml-auto text-gray-300" size={20} />
            </div>
            <div className="text-xs text-gray-400 font-medium pl-14">
              пн-пт 10:00 - 19:00
            </div>
          </a>
        </div>

        {/* Links List */}
        <div className="space-y-3">
          <a
            href="https://t.me/+hdjZRGlm5rA5NTBi"
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

          {/* 
            TODO: Replace with actual text content page/modal if text is provided.
            Currently linking to the post as requested/implied by lack of text.
            User note: "вот этот пост текстовый вставить, но внизу там "Леся и Люда" - заменить на "Люда и Света""
          */}
          <button
            onClick={() => setIsHowItWorksOpen(true)}
            className="w-full flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-[0.98] text-left"
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
              <HelpCircle size={20} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-gray-900 block">Как все устроено</span>
              <span className="text-[10px] text-gray-400 block mt-1">Нажмите, чтобы прочитать</span>
            </div>
            <ChevronRight className="ml-auto text-gray-300" size={20} />
          </button>

          <a
            href="https://drive.google.com/file/d/1l8mYVAtxtbkdK1ep0ohYS6cFn6qc2IWC/view"
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

        {/* Modal */}
        {isHowItWorksOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="font-bold text-lg">Как все устроено</h3>
                <button 
                  onClick={() => setIsHowItWorksOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-4">
                <p className="font-medium text-gray-900">
                  Друзья,
                </p>
                <p>
                  У нас в Клубе стильных много новеньких, и рада приветствовать вас с нашем стильном пространстве ❤️
                </p>
                <p>
                  Чтобы вам было проще здесь ориентироваться, расскажу о том, как тут все устроено.
                </p>
                <p>
                  Клуб стильных - это не только полезный канал со стильными идеями и полезной информацией, но еще и очень теплое сообщество единомышлениц, увлеченных стилем, которые общаются в нашем чате.
                </p>
                <p>
                  Весь основной контент, который мы с командой готовим для вас 6 дней в неделю выходит здесь - в канале Клуба стильных.
                </p>
                <p>
                  Мои образы со ссылками на вещи, доступные к покупке в момент публикации, выходят в постах, отмеченных хэштегом <span className="text-pink-500 font-medium">#lookдняЛена</span>. Нажмите на него для удобного поиска этих постов в канале.
                </p>
                <p>
                  Иногда я делюсь интересными находками, их можно найти по хэштегу <span className="text-pink-500 font-medium">#вещьдня</span>.
                </p>
                <p>
                  В клубе есть система хэштегов, позволяющая быстро находить и другие посты или рубрики. Например, образы по типам фигур или видам вещей. Нажмите на соответствующий хэштег в канале и увидите посты, которые им отмечены.
                </p>
                <p>
                  Помимо канала у нас есть чат, который разделен на тематические ветки:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Болталка</strong> - здесь вы можете общаться, делиться советами, задавать вопросы и просто приятно проводить время с одноклубницами 🌸</li>
                  <li><strong>#lookдня</strong> - чат, в котором вы делитесь своими образами</li>
                  <li><strong>Вопросы и предложения</strong> - технический чат для организационных и технических вопросов, а также ваших предложений по работе Клуба стильных</li>
                  <li><strong>Ссылки на находки</strong> - чат, в котором участницы делятся ссылками на свои находки</li>
                  <li><strong>Навигация</strong> - здесь вы легко можете найти темы, которые ранее были в Клубе и быстро перейти к ним, а также обзоры брендов и записи прямых эфиров</li>
                  <li><strong>Новости</strong> - в этом чате дублируем важные информационные сообщения и анонсы</li>
                </ul>
                <p>
                  В чате работают стилисты из моей команды - <strong>Света и Люда</strong>, они помогают отвечать на ваши вопросы с понедельника по пятницу.
                </p>
                <div className="bg-blue-50 p-4 rounded-xl text-blue-800">
                  <p className="mb-2">По техническим вопросам вам всегда помогут в службе заботы <a href="https://t.me/elennne_school_bot" target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-blue-300 underline-offset-2">@elennne_school_bot</a></p>
                  <p className="text-xs opacity-80">(срок ответа службы заботы до 24 часов с 10 до 20 часов МСК по будням)</p>
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
