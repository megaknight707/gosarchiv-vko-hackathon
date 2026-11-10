// Прейскурант государственных архивов ВКО (постановление акимата от 15.12.2023 № 289).
// Данные перенесены из официального текста в ИПС «Әділет» (RU и KZ, 8 разделов, 218 позиций)
// без изменений — файл price-list-289.json. Сайт только показывает цены: заказов и оплаты нет.
import type { Locale } from "@/i18n/routing";
import data from "./price-list-289.json";

export type PriceItem = { index: string; name: string; unit: string; price: string };
export type PriceSection = { number: string; title: string; items: PriceItem[] };

/** Позиции, о которых чаще всего спрашивают посетители (копии и справки) */
const POPULAR = ["8.1.1.1.4", "8.1.1.1.5", "8.3.1", "8.3.2", "8.5.2", "8.5.3", "6.1", "6.7"];

export const PRICE_LIST_SOURCE = data.source;

export function getPriceList(locale: Locale) {
  // Официальный текст есть только на казахском и русском; для EN показываем русский
  const kz = locale === "kz";
  const sections: PriceSection[] = data.sections.map((s) => ({
    number: s.number,
    title: kz ? s.titleKz : s.titleRu,
    items: s.items.map((i) => ({ index: i.index, name: kz ? i.nameKz : i.nameRu, unit: kz ? i.unitKz : i.unitRu, price: i.price })),
  }));
  const all = sections.flatMap((s) => s.items);
  return {
    sections,
    notes: kz ? data.notesKz : data.notesRu,
    popular: POPULAR.map((index) => all.find((i) => i.index === index)).filter((i): i is PriceItem => Boolean(i)),
    total: all.filter((i) => i.price).length,
  };
}
