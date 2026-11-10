"use client";

// Поиск из шапки: иконка → окно с полем ввода → переход в каталог с запросом
// (/ru/catalog?q=...). Обычная форма GET — работает даже без JavaScript.
import Form from "next/form";
import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function SearchDialog({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("Search");

  return (
    <Dialog>
      <DialogTrigger
        aria-label={t("open")}
        title={t("open")}
        className={cn(
          "grid size-9 place-items-center rounded-full border border-border bg-surface text-ink transition-colors hover:bg-chip",
          className,
        )}
      >
        <Search aria-hidden className="size-4" />
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="top-[15%] translate-y-0 gap-3 border-border bg-surface p-5 sm:max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <DialogTitle className="font-serif text-xl font-bold">{t("title")}</DialogTitle>
          <DialogClose aria-label={t("close")} className="grid size-8 place-items-center rounded-full hover:bg-chip">
            <X aria-hidden className="size-4" />
          </DialogClose>
        </div>
        <DialogDescription className="text-sm text-muted-foreground">{t("hint")}</DialogDescription>
        <Form action={`/${locale}/catalog`} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="site-search" className="sr-only">
            {t("label")}
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            required
            autoFocus
            autoComplete="off"
            placeholder={t("placeholder")}
            className="h-11 flex-1 rounded-lg border border-border bg-bg px-3 text-base text-ink placeholder:text-muted-ink"
          />
          <button type="submit" className="h-11 rounded-lg bg-primary px-5 font-bold text-primary-foreground hover:opacity-90">
            {t("submit")}
          </button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
