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
      { protocol: "https", hostname: "res.cloudinary.com" }
    ]
  }
};

export default nextConfig;
