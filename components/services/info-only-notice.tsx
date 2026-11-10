// Плашка «сайт информационный»: на страницах услуг ясно, что оформления и оплаты здесь нет.
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

export function InfoOnlyNotice() {
  const t = useTranslations("Services");
  return (
    <p role="note" className="flex items-start gap-3 rounded-[14px] border border-accent-2/40 bg-accent-2-soft px-4 py-3 text-sm leading-relaxed">
      <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-2" />
      <span>{t("infoOnly")}</span>
    </p>
  );
}
