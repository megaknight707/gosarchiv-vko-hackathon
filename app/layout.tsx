import type { Metadata } from "next";
import { JetBrains_Mono, PT_Sans, PT_Serif } from "next/font/google";
import "./globals.css";

// Казахские буквы Ә Ғ Қ Ң Ө Ұ Ү Һ І находятся в наборе cyrillic-ext — без него
// браузер подставил бы системный шрифт и буквы выглядели бы «чужими».
const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "700"],
  display: "swap",
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400"],
  display: "swap",
});

const isDemoMode = process.env.DEMO_MODE !== "false";

export const metadata: Metadata = {
  title: "Госархив ВКО",
  description: "Государственный архив Восточно-Казахстанской области — информационный сайт",
  // В демо-режиме сайт не индексируется поисковиками
  robots: isDemoMode ? { index: false, follow: false } : undefined,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${ptSans.variable} ${ptSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {isDemoMode && (
          <div className="bg-accent-2 px-4 py-1.5 text-center text-sm text-white">
            Проект Code Masters Hackathon 9.0 — не официальный сайт Госархива ВКО
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
