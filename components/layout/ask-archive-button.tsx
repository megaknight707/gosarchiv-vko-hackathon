// Плавающая кнопка «Спросить архив». На этапе 6 откроет ИИ-помощника;
// пока ведёт в электронный каталог (там можно искать своими словами).
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AskArchiveButton() {
  const t = useTranslations("Header");
  return (
    <Link
      href="/catalog"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 inline-flex items-center gap-2 rounded-full bg-accent-2 px-[18px] py-3 font-bold text-white shadow-[0_12px_30px_rgba(0,0,0,.3)] transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6 dark:text-[#0f1a1c]"
    >
      <Sparkles aria-hidden className="size-4" />
      {t("askArchive")}
    </Link>
  );
}
