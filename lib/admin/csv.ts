// CSV для импорта и экспорта (ТЗ §6.3). Свой небольшой разборщик без зависимостей:
//  • разделитель «;» или «,» определяется автоматически (Excel в русской локали сохраняет «;»);
//  • поля в кавычках, кавычки внутри («»), переносы строк внутри поля;
//  • метка BOM в начале файла (Excel) убирается.
// При экспорте добавляем BOM и «;» — так файл правильно открывается в Excel с кириллицей.

export function detectDelimiter(text: string): ";" | "," {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  // Пустые строки (например, в конце файла) не считаем записями
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Ячейки, начинающиеся с = + - @, Excel выполнил бы как формулу — экранируем (CSV-инъекция) */
function escapeCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return "﻿" + [header, ...rows].map((row) => row.map(escapeCell).join(";")).join("\r\n") + "\r\n";
}
