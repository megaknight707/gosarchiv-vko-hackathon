// Распознавание архивного шифра в строке поиска:
//   «Ф. 1520 · Оп. 2 · Д. 14», «Ф.1520 Оп.2 Д.14», «ф1520 оп2 д14», «1520/2/14», «Р-12/2/3»,
//   «фонд 1520», «Fonds 1520 inv 2 file 14». Неполный шифр («ф 1520») — поиск по фонду.

export type ParsedCipher = { fund: string; inventory?: string; unit?: string };

/** Номер фонда: «1520», «Р-12», «P12» (латинская P приводится к кириллической Р) */
export function normalizeFundNumber(value: string): string {
  const upper = value.toUpperCase().replace(/\s+/g, "").replace(/^P/, "Р");
  const match = upper.match(/^(Р)-?(\d+)$/);
  return match ? `Р-${match[2]}` : upper;
}

const FUND = String.raw`([рpRP]\s*-?\s*\d+|\d+)`;
const NUM = String.raw`(\d+)`;

const PATTERNS: RegExp[] = [
  // Ф. 1520 · Оп. 2 · Д. 14 / ф1520 оп2 д14 / фонд 1520 опись 2 дело 14
  new RegExp(String.raw`^ф(?:онд)?\.?\s*№?\s*${FUND}[\s.,·;/]*оп(?:ись)?\.?\s*№?\s*${NUM}[\s.,·;/]*д(?:ело)?\.?\s*№?\s*${NUM}$`, "iu"),
  // English: Fonds 1520 inv 2 file 14 / F. 1520 Op. 2 D. 14
  new RegExp(String.raw`^f(?:onds?)?\.?\s*${FUND}[\s.,·;/]*(?:inv(?:entory)?|op)\.?\s*${NUM}[\s.,·;/]*(?:file|d|item)\.?\s*${NUM}$`, "iu"),
  // 1520/2/14 или 1520-2-14 (кроме «Р-12»)
  new RegExp(String.raw`^${FUND}\s*[/\\]\s*${NUM}\s*[/\\]\s*${NUM}$`, "iu"),
  // Казахский: Қ. 1520 Т. 2 І. 14 (қор, тізімдеме, іс)
  new RegExp(String.raw`^қ(?:ор)?\.?\s*${FUND}[\s.,·;/]*т(?:ізімдеме)?\.?\s*${NUM}[\s.,·;/]*і(?:с)?\.?\s*${NUM}$`, "iu"),
];

const FUND_ONLY = new RegExp(String.raw`^(?:ф(?:онд)?|f(?:onds?)?|қ(?:ор)?)\.?\s*№?\s*${FUND}$`, "iu");

export function parseCipher(input: string): ParsedCipher | null {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text || text.length > 60) return null;
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (match) return { fund: normalizeFundNumber(match[1]), inventory: match[2], unit: match[3] };
  }
  const fundOnly = text.match(FUND_ONLY);
  if (fundOnly) return { fund: normalizeFundNumber(fundOnly[1]) };
  return null;
}
