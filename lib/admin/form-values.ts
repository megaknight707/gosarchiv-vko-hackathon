// Значения записи из базы → начальные значения формы (строки, флажки, списки id).
import { fieldColumns, type EntityConfig } from "./entity-config";
import type { FormValues } from "@/components/admin/admin-entity-form";

export function toFormValues(config: EntityConfig, record: Record<string, unknown> | null, defaults: { isDemo: boolean }): FormValues {
  const values: FormValues = {};
  for (const field of config.fields) {
    if (field.type === "tags") {
      values.tags = ((record?.tags as { id: string }[] | undefined) ?? []).map((tag) => tag.id);
      continue;
    }
    for (const column of fieldColumns(field)) {
      const value = record?.[column];
      if (value === null || value === undefined) values[column] = field.type === "boolean" ? false : "";
      else if (value instanceof Date) values[column] = value.toISOString().slice(0, 10);
      else if (typeof value === "boolean") values[column] = value;
      else values[column] = String(value);
    }
  }
  // Новые филиалы видны на карте по умолчанию
  if (!record && config.key === "branches") values.isVisibleOnMap = true;
  if (config.demoFlag) values.isDemo = record ? record.isDemo === true : defaults.isDemo;
  return values;
}
