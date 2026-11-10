// Ссылка «Перейти к содержимому» — видна только при навигации с клавиатуры (Tab).
// Позволяет пропустить шапку и меню и сразу попасть к основному содержимому.
import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("Header");
  return (
    <a
      href="#main-content"
      className="sr-only z-[100] rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {t("skipToContent")}
    </a>
  );
}
