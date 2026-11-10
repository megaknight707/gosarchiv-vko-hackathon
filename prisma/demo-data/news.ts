// Новости — короткие пересказы реальных новостей с сайта архива со ссылкой на источник.
// Подробностей, которых нет в источнике, не добавляем.
import type { BranchSlug } from "./reference";

const SOURCE = "http://e-arhiv.vko.gov.kz/ru";

export const news: {
  slug: string;
  category: "EVENT" | "EXHIBITION" | "CONFERENCE" | "RESEARCH" | "BRANCH";
  branch?: BranchSlug;
  publishedAt: string;
  titleKz: string;
  titleRu: string;
  titleEn: string;
  excerptKz: string;
  excerptRu: string;
  excerptEn: string;
  sourceUrl: string;
}[] = [
  {
    slug: "den-pozhilogo-cheloveka-2026",
    category: "EVENT",
    publishedAt: "2026-10-01",
    titleKz: "Қарттар күніне арналған іс-шара",
    titleRu: "Мероприятие ко Дню пожилого человека",
    titleEn: "Event for the International Day of Older Persons",
    excerptKz: "2026 жылғы 1 қазанда архив Қарттар күніне арналған іс-шара өткізді. Толығырақ — архив сайтындағы түпнұсқа жаңалықта.",
    excerptRu: "1 октября 2026 года архив провёл мероприятие, посвящённое Дню пожилого человека. Подробнее — в оригинальной новости на сайте архива.",
    excerptEn: "On 1 October 2026 the archive held an event dedicated to the Day of Older Persons. Details are in the original news item on the archive's website.",
    sourceUrl: SOURCE,
  },
  {
    slug: "den-otkrytyh-dverej-altai-2026",
    category: "BRANCH",
    branch: "altai",
    publishedAt: "2026-09-21",
    titleKz: "Алтай филиалында ашық есік күні",
    titleRu: "День открытых дверей в филиале Алтай",
    titleEn: "Open Day at the Altai Branch",
    excerptKz: "2026 жылғы 21 қыркүйекте Алтай филиалы ашық есік күнін өткізді. Толығырақ — архив сайтындағы түпнұсқа жаңалықта.",
    excerptRu: "21 сентября 2026 года филиал Алтай провёл День открытых дверей. Подробнее — в оригинальной новости на сайте архива.",
    excerptEn: "On 21 September 2026 the Altai branch held an Open Day. Details are in the original news item on the archive's website.",
    sourceUrl: SOURCE,
  },
  {
    slug: "arhiv-i-budushchee-pokolenie-ridder-2026",
    category: "BRANCH",
    branch: "ridder",
    publishedAt: "2026-09-18",
    titleKz: "Риддер филиалында «Архив және болашақ ұрпақ» іс-шарасы",
    titleRu: "«Архив и будущее поколение» в Риддерском филиале",
    titleEn: "“The Archive and the Next Generation” at the Ridder Branch",
    excerptKz: "2026 жылғы 18 қыркүйекте Риддер филиалында «Архив және болашақ ұрпақ» іс-шарасы өтті. Толығырақ — архив сайтындағы түпнұсқа жаңалықта.",
    excerptRu: "18 сентября 2026 года в Риддерском филиале прошло мероприятие «Архив и будущее поколение». Подробнее — в оригинальной новости на сайте архива.",
    excerptEn: "On 18 September 2026 the Ridder branch hosted the event “The Archive and the Next Generation”. Details are in the original news item on the archive's website.",
    sourceUrl: SOURCE,
  },
];
