"use client";

// Понятный экран ошибки в стиле сайта: что случилось и что делать дальше.
// Технические подробности не показываем посетителю — только код (digest) для обращения в поддержку.
import { RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ErrorView({ reset, digest }: { reset: () => void; digest?: string }) {
  const t = useTranslations("Errors");
  return (
    <div role="alert" className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <span className="mb-6 grid size-16 place-items-center rounded-full border-2 border-dashed border-primary text-primary">
        <TriangleAlert aria-hidden className="size-7" />
      </span>
      <h1 className="font-serif text-3xl font-bold">{t("title")}</h1>
      <p className="mt-4 text-muted-ink">{t("text")}</p>
      {digest && <p className="mt-2 font-mono text-xs text-muted-ink">{t("code", { digest })}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-[18px] py-2.5 font-bold text-primary-foreground hover:opacity-90">
          <RotateCcw aria-hidden className="size-4" />
          {t("retry")}
        </button>
        <Link href="/" className="rounded-[10px] border border-border bg-surface px-[18px] py-2.5 font-bold hover:bg-chip">
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
