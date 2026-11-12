// Плашка DEMO_MODE над шапкой: честно предупреждает, что это хакатонный проект.
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

export function DemoBanner() {
  const t = useTranslations("Demo");
  return (
    <div role="note" className="bg-primary px-4 py-1.5 text-center text-[13px] leading-snug text-primary-foreground">
      <Info aria-hidden className="mr-1.5 inline size-3.5 -translate-y-px" />
      {t("banner")}
    </div>
  );
}
