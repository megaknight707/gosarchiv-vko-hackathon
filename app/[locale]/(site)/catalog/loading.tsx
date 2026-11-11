// Пока страница загружается — скелетон вместо пустого экрана
import { useTranslations } from "next-intl";
import { PageSkeleton } from "@/components/layout/page-skeleton";

export default function Loading() {
  const t = useTranslations("Errors");
  return <PageSkeleton label={t("loading")} />;
}
