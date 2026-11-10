// Нормализация текста для поиска и нечёткое сравнение строк (как pg_trgm в PostgreSQL).

/** Нижний регистр, ё → е, дефисы и знаки препинания → пробелы, лишние пробелы убраны */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Набор триграмм слова по правилам pg_trgm: «  слово » → «  с», « сл», «сло», … */
function trigrams(text: string): Set<string> {
  const result = new Set<string>();
  for (const word of normalizeText(text).split(" ")) {
    if (!word) continue;
    const padded = `  ${word} `;
    for (let i = 0; i < padded.length - 2; i++) result.add(padded.slice(i, i + 3));
  }
  return result;
}

/** Похожесть строк от 0 до 1 (доля общих триграмм). «Усть-Каменогрск» ~ «Усть-Каменогорск» ≈ 0.7 */
export function trigramSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) if (tb.has(t)) common++;
  return common / (ta.size + tb.size - common);
}

/** Экранирование спецсимволов для RegExp */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Экранирование % и _ для ILIKE (сам шаблон передаётся параметром, не конкатенацией SQL) */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}
