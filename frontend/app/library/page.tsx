"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, Trash2 } from "lucide-react";
import BottomNav from "../../components/BottomNav";

export default function Library() {
  const [activeTab, setActiveTab] = useState<"favorites" | "recent">("favorites");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const savedFavs = localStorage.getItem("favorites");
    const savedRecent = localStorage.getItem("recent");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedRecent) setRecent(JSON.parse(savedRecent));
  }, []);

  const removeFavorite = (item: string) => {
    const newFavs = favorites.filter(i => i !== item);
    setFavorites(newFavs);
    localStorage.setItem("favorites", JSON.stringify(newFavs));
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.setItem("recent", JSON.stringify([]));
  };

  return (
    <div className="min-h-screen pb-24 font-sans relative">
      <div className="relative z-10 max-w-md mx-auto min-h-screen">
        {/* Header Tabs */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pt-12 pb-4 px-6 shadow-sm">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "favorites"
                  ? "bg-white text-pink-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Heart size={16} className={activeTab === "favorites" ? "fill-current" : ""} />
              Избранное
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "recent"
                  ? "bg-white text-pink-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Clock size={16} />
              Недавно
            </button>
          </div>
        </div>

        <div className="px-6 mt-6">
          {activeTab === "favorites" ? (
            <div className="space-y-4">
              {favorites.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Heart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Пока нет избранного</p>
                </div>
              ) : (
                favorites.map((item) => (
                  <div key={item} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group">
                    <span className="font-bold text-gray-800">{item}</span>
                    <button onClick={() => removeFavorite(item)} className="p-2 text-gray-300 hover:text-pink-500 transition-colors">
                      <Heart size={20} className="fill-pink-500 text-pink-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
               {recent.length > 0 && (
                  <div className="flex justify-end mb-2">
                      <button onClick={clearRecent} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                          <Trash2 size={12} /> Очистить
                      </button>
                  </div>
               )}
              {recent.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock size={48} className="mx-auto mb-4 opacity-20" />
                  <p>История просмотров пуста</p>
                </div>
              ) : (
                recent.map((item, idx) => (
                  <div key={`${item}-${idx}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                    <span className="font-medium text-gray-700">{item}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
