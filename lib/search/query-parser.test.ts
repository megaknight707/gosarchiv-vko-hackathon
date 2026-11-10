// Тесты разбора запроса «своими словами» (запасной режим ИИ-помощника): npm test
import { describe, expect, it } from "vitest";
import { places } from "../../prisma/demo-data/reference";
import { parseQuery, type PlaceAliases } from "./query-parser";

const PLACES: PlaceAliases[] = places.map((p) => ({ slug: p.slug, aliases: [...p.aliases, p.nameKz, p.nameRu, p.nameEn] }));
const parse = (text: string) => parseQuery(text, PLACES).filters;

describe("parseQuery — пример из ТЗ на трёх языках", () => {
  const expected = { type: ["PHOTO"], place: ["ust-kamenogorsk"], from: 1960, to: 1969 };
  it.each([
    "Хочу найти фотографии Усть-Каменогорска в 1960-х годах",
    "1960-жылдардағы Өскеменнің фотосуреттері",
    "Photos of Ust-Kamenogorsk in the 1960s",
    "фото Өскемен 60-х",
  ])("%s", (q) => expect(parse(q)).toMatchObject(expected));
});

describe("parseQuery — годы и периоды", () => {
  it.each<[string, number, number]>([
    ["документы 1964 года", 1964, 1964],
    ["приказы 1960–1965", 1960, 1965],
    ["с 1950 по 1970", 1950, 1970],
    ["from 1941 to 1945", 1941, 1945],
    ["в 60-е", 1960, 1969],
    ["1970-е годы", 1970, 1979],
    ["XIX век", 1801, 1900],
    ["19 век", 1801, 1900],
    ["documents of the 1980s", 1980, 1989],
    ["1950 жылдан 1960 жылға дейін", 1950, 1960],
  ])("%s → %i–%i", (q, from, to) => expect(parse(q)).toMatchObject({ from, to }));
});

describe("parseQuery — места с вариантами написания", () => {
  it.each<[string, string]>([
    ["фото Лениногорска", "ridder"],
    ["документы Риддера", "ridder"],
    ["Зыряновск 1970", "altai"],
    ["oskemen photos", "ust-kamenogorsk"],
    ["усть каменогрск", "ust-kamenogorsk"],
    ["Зайсан", "zaisan"],
  ])("%s → %s", (q, slug) => expect(parse(q).place).toContain(slug));
});

describe("parseQuery — типы документов", () => {
  it.each<[string, string]>([
    ["карты Шемонаихи", "MAP_DRAWING"],
    ["кинохроника 1970-х", "AUDIO_VIDEO"],
    ["видео о стройке", "AUDIO_VIDEO"],
    ["maps of the region", "MAP_DRAWING"],
    ["протоколы заседаний", "TEXT"],
    ["суреттер", "PHOTO"],
  ])("%s → %s", (q, type) => expect(parse(q).type).toContain(type));
});

describe("parseQuery — темы", () => {
  it.each<[string, string]>([
    ["освоение целины", "virgin-lands"],
    ["документы о войне 1941–1945", "war"],
    ["фото Усть-Каменогорской ГЭС", "energy"],
    ["история школ", "education"],
    ["соғыс жылдарындағы құжаттар", "war"],
    ["industry of Ridder", "industry"],
    ["партизаны", "partisans"],
  ])("%s → %s", (q, topic) => expect(parse(q).topic).toContain(topic));
});

describe("parseQuery — остаток текста и уверенность", () => {
  it("непонятые слова уходят в полнотекстовый поиск", () => {
    const result = parseQuery("фотографии Бухтарминской плотины", PLACES);
    expect(result.filters.type).toEqual(["PHOTO"]);
    expect(result.freeText).toContain("бухтарминской");
  });
  it("полностью понятый запрос — высокая уверенность", () => {
    expect(parseQuery("фото Риддера 1960-х", PLACES).confidence).toBe(1);
  });
  it("запрос без распознанных фильтров — нулевая уверенность", () => {
    const result = parseQuery("как проехать в читальный зал", PLACES);
    expect(result.confidence).toBe(0);
    expect(result.filters).toMatchObject({ type: [], place: [], topic: [] });
  });
});
