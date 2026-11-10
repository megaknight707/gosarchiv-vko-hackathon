"use client";

// Тема оформления (next-themes): ставит класс «dark» на <html> ещё до отрисовки
// страницы (маленький встроенный скрипт), поэтому нет «мигания» светлой темы.
// Выбор хранится в localStorage; по умолчанию — как в системе пользователя.
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
