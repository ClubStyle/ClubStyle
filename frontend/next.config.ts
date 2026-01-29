import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ir.ozone.ru" },
      { protocol: "https", hostname: "www.techprom.ru" },
      { protocol: "https", hostname: "www.spb-rio.ru" },
      { protocol: "https", hostname: "idol.ru" },
      { protocol: "https", hostname: "promokodi.travelask.ru" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "palazzo.by" },
      { protocol: "https", hostname: "mono-stil.ru" },
      { protocol: "https", hostname: "headhunter.ge" },
      { protocol: "https", hostname: "avatars.mds.yandex.net" },
      { protocol: "https", hostname: "irecommend.ru" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "marmelad-megamall.ru" },
      { protocol: "https", hostname: "cdn1-media.rabota.ru" },
      { protocol: "https", hostname: "tambov.mega-hand.ru" },
      { protocol: "https", hostname: "cdn.bolshoy.me" },
      { protocol: "https", hostname: "i.taplink.st" }
    ]
  }
};

export default nextConfig;
