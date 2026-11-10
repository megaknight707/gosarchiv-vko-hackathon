// Страница 404 в стиле сайта, на языке текущего раздела.
import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const tCommon = useTranslations("Common");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="mb-6 grid size-16 -rotate-6 place-items-center rounded-full border-2 border-dashed border-primary text-primary">
        <SearchX aria-hidden className="size-7" />
      </span>
      <p className="font-mono text-sm text-muted-ink">{t("code")}</p>
      <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h1>
      <p className="mt-4 text-muted-ink">{t("text")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="rounded-[10px] bg-primary px-[18px] py-2.5 font-bold text-primary-foreground hover:opacity-90">
          {tCommon("goToCatalog")}
        </Link>
        <Link href="/" className="rounded-[10px] border border-border bg-surface px-[18px] py-2.5 font-bold hover:bg-chip">
          {tCommon("goHome")}
        </Link>
      </div>
    </div>
  );
}
