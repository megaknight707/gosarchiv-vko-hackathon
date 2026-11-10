"use client";

// Переключатель светлой / тёмной темы. Иконка выбирается через CSS (класс dark),
// поэтому на сервере и в браузере разметка одинаковая — без ошибок гидратации.
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("Theme");

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t("toggle")}
      title={t("toggle")}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-chip",
        className,
      )}
    >
      <Moon aria-hidden className="size-4 dark:hidden" />
      <Sun aria-hidden className="hidden size-4 dark:block" />
    </button>
  );
}
