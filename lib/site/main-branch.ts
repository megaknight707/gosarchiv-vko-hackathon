// Контакты центрального здания для шапки и подвала — из базы (Branch.isMain).
// React cache() — один запрос к базе на страницу, даже если данные нужны в нескольких местах.
// Если база недоступна, шапка и подвал всё равно рисуются, просто без контактов.
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getMainBranch = cache(async () => {
  try {
    return await db.branch.findFirst({
      where: { isMain: true },
      select: {
        slug: true,
        nameKz: true,
        nameRu: true,
        nameEn: true,
        addressKz: true,
        addressRu: true,
        addressEn: true,
        phone: true,
        email: true,
        workHoursKz: true,
        workHoursRu: true,
        workHoursEn: true,
        readingRoomHoursKz: true,
        readingRoomHoursRu: true,
        readingRoomHoursEn: true,
      },
    });
  } catch (error) {
    console.error("Не удалось загрузить контакты архива:", error);
    return null;
  }
});

export type MainBranch = NonNullable<Awaited<ReturnType<typeof getMainBranch>>>;

/** Ссылка tel: из номера вида «8 (7232) 25-59-76» */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
