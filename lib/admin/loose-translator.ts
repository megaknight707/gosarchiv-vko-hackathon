// Переводчик для динамических ключей админки: t(`nav.${entity}`), t(`status.${status}`).
// Строгие типы next-intl не знают заранее, какой раздел придёт из адреса, поэтому здесь
// проверка ключей на этапе компиляции отключена. Полноту переводов проверяет то, что
// во всех трёх файлах messages/*.json одинаковый набор ключей раздела Admin.
export type LooseTranslator = ((key: string, values?: Record<string, string | number | Date>) => string) & {
  has: (key: string) => boolean;
};

export function loose(t: unknown): LooseTranslator {
  return t as LooseTranslator;
}
