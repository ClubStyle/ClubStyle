"use client";

import { Home as HomeIcon, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(236,72,153,0.15)] px-6 py-3 flex justify-between items-center border border-pink-100/50 relative overflow-hidden ring-1 ring-pink-50">
        <div className="flex justify-between w-full items-center">
          <Link href="/" className="flex flex-col items-center gap-1 group relative">
            <div
              className={`p-1.5 rounded-full transition-all duration-300 ${
                isActive("/") 
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-200" 
                  : "text-gray-400 group-hover:text-pink-400 group-hover:bg-pink-50"
              }`}
            >
              <HomeIcon size={20} strokeWidth={isActive("/") ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${isActive("/") ? "text-pink-500" : "text-gray-400 group-hover:text-pink-400"}`}>
              Главная
            </span>
          </Link>
          
          <Link href="/community" className="flex flex-col items-center gap-1 group relative">
            <div
              className={`p-1.5 rounded-full transition-all duration-300 ${
                isActive("/community") 
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-200" 
                  : "text-gray-400 group-hover:text-pink-400 group-hover:bg-pink-50"
              }`}
            >
              <Users size={20} strokeWidth={isActive("/community") ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${isActive("/community") ? "text-pink-500" : "text-gray-400 group-hover:text-pink-400"}`}>
              Сообщество
            </span>
          </Link>

          <Link href="/library" className="flex flex-col items-center gap-1 group relative">
            <div
              className={`p-1.5 rounded-full transition-all duration-300 ${
                isActive("/library") 
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-200" 
                  : "text-gray-400 group-hover:text-pink-400 group-hover:bg-pink-50"
              }`}
            >
              <BookOpen size={20} strokeWidth={isActive("/library") ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${isActive("/library") ? "text-pink-500" : "text-gray-400 group-hover:text-pink-400"}`}>
              Библиотека
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
