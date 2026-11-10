// Справочники: населённые пункты с вариантами написания, тематические группы фондов, теги.
// Филиалы — в ./branches.ts (реальные данные архива).

import { branches } from "./branches";

export { branches };

// Центры городов — координаты для населённых пунктов каталога
const CITY_CENTER = {
  ustKamenogorsk: { latitude: 49.9483, longitude: 82.6275 },
  zaisan: { latitude: 47.4667, longitude: 84.8667 },
  ridder: { latitude: 50.3443, longitude: 83.5126 },
  altai: { latitude: 49.7339, longitude: 84.2731 },
};

export type BranchSlug = (typeof branches)[number]["slug"];

// Варианты написания — в нижнем регистре; поиск сравнивает нормализованную строку.
export const places = [
  {
    slug: "ust-kamenogorsk",
    nameKz: "Өскемен",
    nameRu: "Усть-Каменогорск",
    nameEn: "Ust-Kamenogorsk",
    aliases: ["усть-каменогорск", "усть каменогорск", "устькаменогорск", "өскемен", "оскемен", "ust-kamenogorsk", "ust kamenogorsk", "oskemen", "öskemen", "укг"],
    ...CITY_CENTER.ustKamenogorsk,
  },
  {
    slug: "ridder",
    nameKz: "Риддер",
    nameRu: "Риддер",
    nameEn: "Ridder",
    aliases: ["риддер", "ridder", "лениногорск", "leninogorsk"],
    ...CITY_CENTER.ridder,
  },
  {
    slug: "altai",
    nameKz: "Алтай",
    nameRu: "Алтай",
    nameEn: "Altai",
    aliases: ["алтай", "altai", "altay", "зыряновск", "zyryanovsk"],
    ...CITY_CENTER.altai,
  },
  {
    slug: "zaisan",
    nameKz: "Зайсан",
    nameRu: "Зайсан",
    nameEn: "Zaisan",
    aliases: ["зайсан", "zaisan", "zaysan"],
    ...CITY_CENTER.zaisan,
  },
  {
    slug: "shemonaikha",
    nameKz: "Шемонаиха",
    nameRu: "Шемонаиха",
    nameEn: "Shemonaikha",
    aliases: ["шемонаиха", "shemonaikha", "shemonaiha"],
    latitude: 50.6275,
    longitude: 81.9105,
  },
  {
    slug: "glubokoe",
    nameKz: "Глубокое",
    nameRu: "Глубокое",
    nameEn: "Glubokoye",
    aliases: ["глубокое", "glubokoe", "glubokoye"],
    latitude: 50.1394,
    longitude: 82.3122,
  },
  {
    slug: "kurchum",
    nameKz: "Күршім",
    nameRu: "Курчум",
    nameEn: "Kurchum",
    aliases: ["курчум", "күршім", "куршим", "kurchum", "kurshim"],
    latitude: 48.5667,
    longitude: 83.65,
  },
  {
    slug: "katon-karagai",
    nameKz: "Катонқарағай",
    nameRu: "Катон-Карагай",
    nameEn: "Katon-Karagai",
    aliases: ["катон-карагай", "катон карагай", "катонқарағай", "катонкарагай", "katon-karagai", "katon-karagay", "katonkaragai"],
    latitude: 49.1667,
    longitude: 85.6167,
  },
];

export type PlaceSlug = (typeof places)[number]["slug"];

// Тематические группы фондов — из «Характеристики фондов» на сайте архива
export const categories = [
  { slug: "industry", nameKz: "Өнеркәсіп", nameRu: "Промышленность", nameEn: "Industry" },
  { slug: "light-food-industry", nameKz: "Жеңіл және тамақ өнеркәсібі", nameRu: "Лёгкая и пищевая промышленность", nameEn: "Light and food industry" },
  { slug: "geology", nameKz: "Геология", nameRu: "Геология", nameEn: "Geology" },
  { slug: "energy", nameKz: "Энергетика", nameRu: "Энергетика", nameEn: "Energy" },
  { slug: "government", nameKz: "Билік және басқару", nameRu: "Власть и управление", nameEn: "Government and administration" },
  { slug: "social", nameKz: "Әлеуметтік сала", nameRu: "Социальная сфера", nameEn: "Social sphere" },
  { slug: "construction", nameKz: "Құрылыс", nameRu: "Строительство", nameEn: "Construction" },
  { slug: "personal", nameKz: "Жеке текті қорлар", nameRu: "Фонды личного происхождения", nameEn: "Personal fonds" },
];

export type CategorySlug = (typeof categories)[number]["slug"];

// Тематика документов (теги)
export const tags = [
  { slug: "city", nameKz: "Қала өмірі", nameRu: "Городская жизнь", nameEn: "City life" },
  { slug: "industry", nameKz: "Өнеркәсіп", nameRu: "Промышленность", nameEn: "Industry" },
  { slug: "energy", nameKz: "Энергетика", nameRu: "Энергетика", nameEn: "Energy" },
  { slug: "construction", nameKz: "Құрылыс", nameRu: "Строительство", nameEn: "Construction" },
  { slug: "war", nameKz: "Ұлы Отан соғысы", nameRu: "Великая Отечественная война", nameEn: "Great Patriotic War" },
  { slug: "virgin-lands", nameKz: "Тың игеру", nameRu: "Освоение целины", nameEn: "Virgin Lands campaign" },
  { slug: "agriculture", nameKz: "Ауыл шаруашылығы", nameRu: "Сельское хозяйство", nameEn: "Agriculture" },
  { slug: "education", nameKz: "Білім беру", nameRu: "Образование", nameEn: "Education" },
  { slug: "science", nameKz: "Ғылым", nameRu: "Наука", nameEn: "Science" },
  { slug: "culture", nameKz: "Мәдениет және өнер", nameRu: "Культура и искусство", nameEn: "Culture and arts" },
  { slug: "sport", nameKz: "Спорт", nameRu: "Спорт", nameEn: "Sport" },
  { slug: "geology", nameKz: "Геология", nameRu: "Геология", nameEn: "Geology" },
  { slug: "governance", nameKz: "Мемлекеттік басқару", nameRu: "Государственное управление", nameEn: "Public administration" },
  { slug: "partisans", nameKz: "Партизандық қозғалыс", nameRu: "Партизанское движение", nameEn: "Partisan movement" },
];

export type TagSlug = (typeof tags)[number]["slug"];
