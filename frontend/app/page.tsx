import Image from "next/image";
const footwear = [
  { title: "Сапоги", src: "/сапоги.jpg" },
  { title: "Ботильоны", src: "/ботильоны1.jpg" },
  { title: "Мюли", src: "/мюли.jpg" },
  { title: "Туфли", src: "/туфли.jpg" },
  { title: "Босоножки", src: "/боссоножки.jpg" },
  { title: "Тапки", src: "/тапки.jpg" },
  { title: "Сабо", src: "/сабо.jpg" },
  { title: "Балетки", src: "/балетки.jpg" },
  { title: "Угги", src: "/угги.jpg" },
  { title: "Кеды", src: "/кеды.jpg" },
  { title: "Кроссовки", src: "/кроссы.jpg" }
];

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-16 px-6 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <section className="mt-8 w-full">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Обувь — превью</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {footwear.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative w-full h-40 bg-white">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="px-3 py-2">
                  <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
