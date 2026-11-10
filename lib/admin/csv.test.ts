import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";

describe("parseCsv", () => {
  it("понимает «;» из русского Excel и убирает BOM", () => {
    expect(parseCsv("﻿фонд;опись\r\n1520;2\r\n")).toEqual([
      ["фонд", "опись"],
      ["1520", "2"],
    ]);
  });

  it("понимает «,» и кавычки с разделителем внутри", () => {
    expect(parseCsv('a,b\n"Усть-Каменогорск, 1965","он сказал ""да"""\n')).toEqual([
      ["a", "b"],
      ["Усть-Каменогорск, 1965", 'он сказал "да"'],
    ]);
  });

  it("сохраняет перенос строки внутри поля и пропускает пустые строки", () => {
    expect(parseCsv('x;y\n"строка 1\nстрока 2";2\n\n;\n')).toEqual([
      ["x", "y"],
      ["строка 1\nстрока 2", "2"],
    ]);
  });
});

describe("toCsv", () => {
  it("экранирует формулы Excel и кавычки, добавляет BOM", () => {
    const csv = toCsv(["a", "b"], [["=HYPERLINK(1)", 'текст "в кавычках"']]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain('"текст ""в кавычках"""');
  });

  it("результат читается обратно тем же разборщиком", () => {
    const rows = [["Ф. 1", "строка;с разделителем", "многострочный\nтекст"]];
    expect(parseCsv(toCsv(["x", "y", "z"], rows)).slice(1)).toEqual(rows);
  });
});
