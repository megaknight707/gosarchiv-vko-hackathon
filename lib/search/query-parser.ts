// Разбор запроса «своими словами» без ИИ:
//   «фотографии Усть-Каменогорска в 1960-х» → тип PHOTO, место ust-kamenogorsk, 1960–1969.
// Работает на трёх языках, учитывает падежные окончания и опечатки в названиях мест.
// Распознанные фрагменты убираются из текста; остаток идёт в полнотекстовый поиск.
// Темы (промышленность, война, целина…) → теги каталога. Тот же разбор — запасной режим ИИ-помощника.
import type { DocType } from "./catalog-filters";
import { escapeRegExp, normalizeText, trigramSimilarity } from "./text-normalize";

export type PlaceAliases = { slug: string; aliases: string[] };

export type ParsedQuery = {
  filters: { type: DocType[]; place: string[]; topic: string[]; from?: number; to?: number };
  /** Текст без распознанных фрагментов и служебных слов */
  freeText: string;
  /** 0…1 — насколько полно понят запрос (для этапа 6: при низкой уверенности — уточнение через ИИ) */
  confidence: number;
};

// Слова, обозначающие тип документа (все формы — в нормализованном виде)
const TYPE_WORDS: Record<DocType, RegExp> = {
  PHOTO: /^(фото\p{L}*|снимк\p{L}*|снимок|фотосурет\p{L}*|сурет\p{L}*|photo\p{L}*|pictures?|images?)$/u,
  MAP_DRAWING: /^(карт[аыуеой]?|карт|картах|чертеж\p{L}*|план(ы|ов)?|схем\p{L}*|карта(лар\p{L}*)?|сызба\p{L}*|maps?|drawings?|plans?)$/u,
  AUDIO_VIDEO: /^(видео\p{L}*|аудио\p{L}*|кино\p{L}*|фильм\p{L}*|фонограмм\p{L}*|бейне\p{L}*|videos?|audio|films?|newsreels?|recordings?)$/u,
  TEXT: /^(протокол\p{L}*|приказ\p{L}*|хаттама\p{L}*|бұйрық\p{L}*|minutes|orders?)$/u,
  PERSONAL: /^(рукопис\p{L}*|письм\p{L}*|писем|қолжазба\p{L}*|хат(тар\p{L}*)?|manuscripts?|letters?)$/u,
  ORGANIZATION: /^(отчет\p{L}*|есеп\p{L}*|reports?)$/u,
  HISTORICAL: /^$/u,
};

// Слова, обозначающие тему (слаги тегов каталога). Нормализованный вид: ё → е, нижний регистр.
const TOPIC_WORDS: Record<string, RegExp> = {
  industry: /^(промышлен\p{L}*|завод\p{L}*|комбинат\p{L}*|предприят\p{L}*|өнеркәсіп\p{L}*|зауыт\p{L}*|industr\p{L}*|factor(y|ies)|plants?)$/u,
  energy: /^(энергетик\p{L}*|гэс|электростанц\p{L}*|energy|power|hydroelectric)$/u,
  construction: /^(строител\p{L}*|стройк\p{L}*|құрылыс\p{L}*|construction|building)$/u,
  war: /^(войн\p{L}*|вов|фронт\p{L}*|соғыс\p{L}*|war|wwii|ww2)$/u,
  'virgin-lands': /^(целин\p{L}*|тың\p{L}*|virgin)$/u,
  agriculture: /^(колхоз\p{L}*|совхоз\p{L}*|сельск\p{L}*|ауыл\p{L}*|agricultur\p{L}*|farm\p{L}*)$/u,
  education: /^(школ\p{L}*|образован\p{L}*|учител\p{L}*|мектеп\p{L}*|білім\p{L}*|school\p{L}*|education)$/u,
  science: /^(наук\p{L}*|научн\p{L}*|ғылым\p{L}*|science\p{L}*)$/u,
  culture: /^(культур\p{L}*|театр\p{L}*|искусств\p{L}*|мәдениет\p{L}*|өнер\p{L}*|cultur\p{L}*|theat\p{L}*|arts?)$/u,
  sport: /^(спорт\p{L}*|sports?)$/u,
  geology: /^(геолог\p{L}*|geolog\p{L}*)$/u,
  partisans: /^(партизан\p{L}*|partisans?)$/u,
};

// Служебные слова, которые не несут смысла для поиска
const STOP_WORDS = new Set([
  "в", "во", "на", "и", "с", "со", "по", "из", "за", "к", "о", "об", "от", "до", "для", "про", "хочу", "найти", "найдите",
  "покажи", "покажите", "нужны", "нужно", "есть", "ли", "все", "всё", "года", "годов", "годах", "год", "годы", "гг", "г",
  "век", "века", "веке", "the", "of", "in", "a", "an", "and", "for", "from", "to", "show", "me", "find", "find", "i", "want",
  "year", "years", "s", "документ", "документы", "документов", "документах", "материалы", "материалов", "documents",
  "document", "records", "materials", "құжат", "құжаттар", "құжаттары", "құжаттарды", "материалдар", "және", "мен", "туралы", "жылы", "жылдар", "жылдары", "жылдардағы", "жыл", "ғасыр", "іздеу", "көрсет",
]);

const ROMAN: Record<string, number> = { xvii: 17, xviii: 18, xix: 19, xx: 20, xxi: 21 };

function detectYears(text: string): { from?: number; to?: number; rest: string } {
  let rest = ` ${text} `;
  let from: number | undefined;
  let to: number | undefined;
  const take = (regex: RegExp, handler: (m: RegExpMatchArray) => [number, number] | null) => {
    if (from !== undefined) return;
    const match = rest.match(regex);
    if (!match) return;
    const range = handler(match);
    if (!range) return;
    [from, to] = range;
    rest = rest.replace(match[0], " ");
  };
  const valid = (y: number) => y >= 1000 && y <= 2100;

  // Диапазон: «1960–1965», «с 1950 по 1970», «from 1950 to 1970», «1950 жылдан 1970 жылға дейін»
  take(/(?:с|from)?\s*(\d{4})\s*(?:[-–—]|по|to|жылдан)\s*(\d{4})\D{0,12}/iu, (m) =>
    valid(+m[1]) && valid(+m[2]) ? [Math.min(+m[1], +m[2]), Math.max(+m[1], +m[2])] : null,
  );
  // Десятилетие: «1960-х», «1960-е», «1960-ых», «1960s», «1960-жылдары», «в 1960 годы»
  take(/(\d{3}0)\s*(?:-?\s*(?:х|е|ых|ые|ие|ых|s|'s)|\s*-?\s*жыл\p{L}*|\s*годы|\s*годах)(?=\s|$)/iu, (m) =>
    valid(+m[1]) ? [+m[1], +m[1] + 9] : null,
  );
  // Короткое десятилетие: «60-х», «в 60-е», «60s»
  take(/(?:^|\s)(\d)0\s*-?\s*(?:х|е|ых|ые|s|'s)(?=\s|$)/iu, (m) => [1900 + +m[1] * 10, 1900 + +m[1] * 10 + 9]);
  // Век: «XIX век», «19 век», «19th century», «XIX ғасыр»
  take(/(?:^|\s)(xvii|xviii|xix|xx|xxi|1[7-9]|2[01])(?:\s*-?\s*(?:й|го|th|st|nd))?\s*(?:век\p{L}*|century|ғасыр\p{L}*)/iu, (m) => {
    const century = ROMAN[m[1].toLowerCase()] ?? +m[1];
    return [(century - 1) * 100 + 1, century * 100];
  });
  // Отдельный год: «1964», «1964 года»
  take(/(?:^|\s)(1[6-9]\d{2}|20\d{2})(?:\s*(?:г\.?|года?|году|жылы|year))?(?=\s|$)/iu, (m) => [+m[1], +m[1]]);

  return { from, to, rest: rest.trim() };
}

function detectPlaces(text: string, places: PlaceAliases[]): { slugs: string[]; rest: string } {
  let rest = ` ${text} `;
  const slugs: string[] = [];

  for (const place of places) {
    for (const alias of place.aliases.map(normalizeText).sort((a, b) => b.length - a.length)) {
      if (!alias) continue;
      // Название + до 4 букв окончания: «усть каменогорска», «өскеменнің», «риддере»
      const regex = new RegExp(`(^|\\s)${escapeRegExp(alias)}\\p{L}{0,4}(?=\\s|$)`, "u");
      if (regex.test(rest)) {
        slugs.push(place.slug);
        rest = rest.replace(regex, " ");
        break;
      }
    }
  }

  // Нечёткое совпадение для опечаток: «усть каменогрск», «оскемн»
  if (slugs.length === 0) {
    const words = rest.trim().split(/\s+/).filter(Boolean);
    const candidates = new Set<string>();
    words.forEach((word, i) => {
      if (word.length >= 4) candidates.add(word);
      if (i + 1 < words.length) candidates.add(`${word} ${words[i + 1]}`);
    });
    let best: { slug: string; phrase: string; score: number } | null = null;
    for (const phrase of candidates) {
      for (const place of places) {
        for (const alias of place.aliases) {
          const normalized = normalizeText(alias);
          if (normalized.length < 5) continue;
          const score = trigramSimilarity(phrase, normalized);
          if (score >= 0.5 && (!best || score > best.score)) best = { slug: place.slug, phrase, score };
        }
      }
    }
    if (best) {
      slugs.push(best.slug);
      rest = rest.replace(` ${best.phrase} `, " ").replace(best.phrase, " ");
    }
  }

  return { slugs, rest: rest.trim() };
}

export function parseQuery(text: string, places: PlaceAliases[]): ParsedQuery {
  const normalized = normalizeText(text);
  const years = detectYears(text.toLowerCase().replace(/ё/g, "е"));
  const placesFound = detectPlaces(normalizeText(years.rest), places);

  const types = new Set<DocType>();
  const topics = new Set<string>();
  const leftover: string[] = [];
  for (const word of placesFound.rest.split(/\s+/).filter(Boolean)) {
    const type = (Object.keys(TYPE_WORDS) as DocType[]).find((t) => TYPE_WORDS[t].test(word));
    const topic = type ? undefined : Object.keys(TOPIC_WORDS).find((t) => TOPIC_WORDS[t].test(word));
    if (type) types.add(type);
    else if (topic) topics.add(topic);
    else if (!STOP_WORDS.has(word) && !/^\d{1,3}$/.test(word)) leftover.push(word);
  }

  const recognized = types.size + topics.size + placesFound.slugs.length + (years.from !== undefined ? 1 : 0);
  const totalWords = normalized.split(" ").filter((w) => w && !STOP_WORDS.has(w)).length || 1;

  return {
    filters: { type: [...types], place: placesFound.slugs, topic: [...topics], from: years.from, to: years.to },
    freeText: leftover.join(" "),
    confidence: Math.min(1, recognized / Math.max(1, Math.min(totalWords, 3))),
  };
}
