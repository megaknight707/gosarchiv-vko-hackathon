// В данных филиалов то, чего нет в официальном источнике, помечено строкой «TODO…».
// Такие значения не показываем посетителю — вместо них заглушка «Уточняется».
export function isTodo(value: string | null | undefined): boolean {
  return !value || value.trim().toUpperCase().startsWith("TODO");
}

/** Значение для показа или null, если его нужно заменить заглушкой */
export function knownValue(value: string | null | undefined): string | null {
  return isTodo(value) ? null : value!.trim();
}
