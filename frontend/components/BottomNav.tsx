"use client";

import { Home as HomeIcon, Users, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type BottomNavItem = {
  href: string;
  label: string;
  icon: "home" | "users" | "heart";
};

type BottomNavConfig = {
  items?: BottomNavItem[];
  innerClassName?: string;
};

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const [config, setConfig] = useState<BottomNavConfig | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("bottomNavConfig.v1");
      if (!raw) return null;
      return JSON.parse(raw) as BottomNavConfig;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/materials?key=bottomNav&t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data || typeof data !== "object") return;
        const next = data as BottomNavConfig;
        setConfig(next);
        try {
          sessionStorage.setItem("bottomNavConfig.v1", JSON.stringify(next));
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const fallback: BottomNavItem[] = [
    { href: "/", label: "Главная", icon: "home" },
    { href: "/community", label: "О клубе", icon: "users" },
    { href: "/library", label: "Избранное", icon: "heart" }
  ];
  const items: BottomNavItem[] = (() => {
    if (!config?.items || !Array.isArray(config.items) || config.items.length === 0) {
      return fallback;
    }
    const cleaned = config.items.filter((it) => {
      return (
        it &&
        typeof it === "object" &&
        typeof it.href === "string" &&
        typeof it.label === "string" &&
        (it.icon === "home" || it.icon === "users" || it.icon === "heart")
      );
    });
    return cleaned.length ? cleaned : fallback;
  })();

  const innerClassName =
    (typeof config?.innerClassName === "string" && config.innerClassName.trim()) ||
    "bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(236,72,153,0.15)] px-6 py-3 flex justify-between items-center border border-pink-100/50 relative overflow-hidden ring-1 ring-pink-50";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4">
      <div className={innerClassName}>
        <div className="flex justify-between w-full items-center">
          {items.map((it) => {
            const Icon =
              it.icon === "users" ? Users : it.icon === "heart" ? Heart : HomeIcon;
            return (
              <Link key={it.href} href={it.href} className="flex flex-col items-center gap-1 group relative">
                <div
                  className={`p-1.5 rounded-full transition-all duration-300 ${
                    isActive(it.href)
                      ? "bg-pink-500 text-white shadow-lg shadow-pink-200"
                      : "text-gray-400 group-hover:text-pink-400 group-hover:bg-pink-50"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive(it.href) ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive(it.href)
                      ? "text-pink-500"
                      : "text-gray-400 group-hover:text-pink-400"
                  }`}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
