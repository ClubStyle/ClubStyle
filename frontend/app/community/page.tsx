import Image from "next/image";
import BottomNav from "../../components/BottomNav";
import { Check, Star, Zap, Heart, MessageCircle, Gift } from "lucide-react";

export default function Community() {
  const BENEFITS = [
    { text: "Готовые подборки вещей и образов от стилиста — для жительниц России и других стран", icon: <Check size={18} /> },
    { text: "Первый доступ к продуктам Лены Червовой — приоритетная возможность попасть на обучение", icon: <Zap size={18} /> },
    { text: "Обзоры, тренды, подсказки и стильные советы — всё, что нужно, в одном месте", icon: <Star size={18} /> },
    { text: "Стильные подружки в кармане — поддержка, позитив, комплименты и дружба гарантированы", icon: <Heart size={18} /> },
    { text: "Стилист команды Лены Червовой на связи — поможет разобраться в модных вопросах", icon: <MessageCircle size={18} /> },
    { text: "Уникальные скидки и предложения — персонально для участниц Клуба", icon: <Gift size={18} /> },
    { text: "Закрытые прямые эфиры участниц с Леной Червовой. Наглядные примеры сочетаний и рекомендации — тебе точно понравится", icon: <Zap size={18} /> },
    { text: "Рекомендации и личное мнение Лены Червовой — пора стать ближе!", icon: <Heart size={18} /> },
  ];

  const THEMES = [
    { month: "ЯНВАРЬ", title: "Вещи-инвестиции. Что купить сейчас и носить не один год" },
    { month: "ФЕВРАЛЬ", title: "Пережить зиму и полюбить свое отражение" },
    { month: "МАРТ", title: "Обновляемся без лишних трат" },
  ];

  return (
    <div className="min-h-screen pb-24 font-sans relative">

      <div className="relative z-10 max-w-md mx-auto min-h-screen p-6">
        
        {/* Header */}
        <div className="text-center mb-8 pt-4">
            <h1 className="text-3xl font-black uppercase tracking-wide text-black mb-2">
              Клуб стильных
            </h1>
            <p className="text-sm text-gray-500 font-medium">Твое стильное пространство</p>
        </div>

        {/* Benefits List */}
        <div className="space-y-4 mb-12">
            {BENEFITS.map((benefit, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-start hover:shadow-md transition-shadow">
                    <div className="p-2 rounded-full bg-pink-50 text-pink-500 shrink-0 mt-0.5">
                        {benefit.icon}
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                        {benefit.text}
                    </p>
                </div>
            ))}
        </div>

        {/* Themes Block (Styled like screenshot) */}
        <div className="bg-[#1a1a1a] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden mb-8">
             {/* Decorative Elements */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-3xl rounded-full pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full pointer-events-none"></div>

             <div className="relative z-10">
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-1 leading-none">
                    ТЕМЫ
                </h2>
                <p className="text-sm font-bold uppercase tracking-widest text-pink-400 mb-8">
                    Ближайших трех месяцев:
                </p>

                <div className="space-y-4">
                    {THEMES.map((theme, idx) => (
                        <div key={idx} className="group">
                            <div className="border border-white/30 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <h3 className="text-lg font-bold uppercase mb-1">{theme.month}</h3>
                                <p className="text-sm text-gray-300 leading-snug">{theme.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
