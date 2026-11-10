// Выбор многоязычного поля по языку: pickLocale(doc, "title", "kz") → doc.titleKz.
// Если перевода нет (пустая строка или null) — берём русский вариант.
import type { Locale } from "@/i18n/routing";

const SUFFIX: Record<Locale, "Kz" | "Ru" | "En"> = { kz: "Kz", ru: "Ru", en: "En" };

type Localized<Base extends string> = {
  [K in `${Base}Kz` | `${Base}Ru` | `${Base}En`]?: string | null;
};

export function pickLocale<Base extends string>(
  entity: Localized<Base>,
  field: Base,
  locale: Locale,
): string {
  const record = entity as Record<string, string | null | undefined>;
  const value = record[`${field}${SUFFIX[locale]}`];
  if (value && value.trim()) return value;
  return record[`${field}Ru`] ?? "";
}
