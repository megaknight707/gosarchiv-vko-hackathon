// Филиалы для карты и списков: данные из базы на выбранном языке.
// Значения «TODO…» превращаются в null — интерфейс покажет «Уточняется».
import "server-only";
import { cache } from "react";
import type { Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { knownValue } from "@/lib/archive/todo";
import { pickLocale } from "@/lib/i18n/pick-locale";

export type BranchView = {
  slug: string;
  type: "MAIN" | "BUILDING" | "BRANCH" | "PERSONNEL";
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  workHours: string | null;
  readingRoomHours: string | null;
  description: string | null;
  servedArea: string | null;
  fundsInfo: string | null;
  lat: number;
  lng: number;
  approximate: boolean;
  isMain: boolean;
  photoUrl: string | null;
  /** Все варианты названия города — для поиска «Лениногорск» → Риддер */
  searchText: string;
};

export const getBranches = cache(async (locale: Locale): Promise<BranchView[]> => {
  try {
    const [branches, places] = await Promise.all([
      db.branch.findMany({ where: { isVisibleOnMap: true }, orderBy: { sortOrder: "asc" } }),
      db.place.findMany({ select: { nameRu: true, aliases: true } }),
    ]);
    return branches.map((b) => {
      const cityAliases = places.find((p) => p.nameRu === b.cityRu)?.aliases ?? [];
      return {
        slug: b.slug,
        type: b.type,
        name: pickLocale(b, "name", locale),
        city: pickLocale(b, "city", locale),
        address: knownValue(pickLocale(b, "address", locale)),
        phone: knownValue(b.phone),
        email: knownValue(b.email),
        workHours: knownValue(pickLocale(b, "workHours", locale)),
        readingRoomHours: knownValue(pickLocale(b, "readingRoomHours", locale)),
        description: knownValue(pickLocale(b, "description", locale)),
        servedArea: knownValue(pickLocale(b, "servedArea", locale)),
        fundsInfo: knownValue(pickLocale(b, "fundsInfo", locale)),
        lat: b.latitude,
        lng: b.longitude,
        approximate: b.coordinatesApproximate,
        isMain: b.isMain,
        photoUrl: b.photoUrl,
        searchText: [b.nameKz, b.nameRu, b.nameEn, b.cityKz, b.cityRu, b.cityEn, ...cityAliases].join(" ").toLowerCase(),
      };
    });
  } catch (error) {
    console.error("Не удалось загрузить филиалы:", error);
    return [];
  }
});
