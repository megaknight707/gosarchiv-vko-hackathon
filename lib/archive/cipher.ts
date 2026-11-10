// Архивный шифр: «Ф. 1520 · Оп. 2 · Д. 14»
// Фонд → Опись → Дело. Используется при сохранении документа и в интерфейсе.

export type CipherParts = {
  fund: string;
  inventory: string;
  unit: string;
};

export function formatCipher({ fund, inventory, unit }: CipherParts): string {
  return `Ф. ${fund} · Оп. ${inventory} · Д. ${unit}`;
}
