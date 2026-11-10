"use client";

// Универсальная форма админки: поля строятся из конфигурации сущности.
// Многоязычные поля — на вкладках KZ / RU / EN; на вкладке видно, сколько полей
// без перевода. Проверка — на сервере (zod), ошибки показываются рядом с полем.
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type { SaveState } from "@/lib/admin/entity-actions";
import { localizedNames, type FieldConfig } from "@/lib/admin/entity-config";
import type { Option } from "@/lib/admin/entity-service";
import { cn } from "@/lib/utils";
import { loose } from "@/lib/admin/loose-translator";

const CoordinatePicker = dynamic(() => import("./coordinate-picker").then((m) => m.CoordinatePicker), { ssr: false });

export type FormValues = Record<string, string | boolean | string[] | null>;

const LANGS = [
  { suffix: "Kz", code: "kz" },
  { suffix: "Ru", code: "ru" },
  { suffix: "En", code: "en" },
] as const;

function isLocalized(field: FieldConfig) {
  return (field.type === "text" || field.type === "textarea") && Boolean(field.localized);
}

export function AdminEntityForm({
  fields,
  demoFlag,
  initial,
  options,
  action,
  readOnly,
  submitLabel,
}: {
  fields: FieldConfig[];
  demoFlag?: boolean;
  initial: FormValues;
  options: Record<string, Option[]>;
  action: (state: SaveState, formData: FormData) => Promise<SaveState>;
  readOnly?: boolean;
  submitLabel?: string;
}) {
  const t = loose(useTranslations("Admin"));
  const [state, formAction, pending] = useActionState(action, {} as SaveState);
  const [lang, setLang] = useState<"Kz" | "Ru" | "En">("Ru");
  const formRef = useRef<HTMLFormElement>(null);
  const [missing, setMissing] = useState<Record<string, number>>({});

  const value = (name: string) => (state.raw && name in state.raw ? state.raw[name] : initial[name]);
  const error = (name: string) => state.errors?.[name];

  // Сколько многоязычных полей не заполнено на каждом языке (индикатор на вкладке)
  const recount = useCallback(() => {
    const form = formRef.current;
    if (!form) return;
    const counts: Record<string, number> = { Kz: 0, Ru: 0, En: 0 };
    for (const field of fields.filter(isLocalized)) {
      for (const { suffix } of LANGS) {
        const input = form.elements.namedItem(`${field.name}${suffix}`) as HTMLInputElement | null;
        if (input && !input.value.trim()) counts[suffix]++;
      }
    }
    setMissing(counts);
  }, [fields]);
  useEffect(recount, [recount, state.version]);

  const errorLangs = new Set(
    Object.keys(state.errors ?? {})
      .map((name) => LANGS.find((l) => name.endsWith(l.suffix) && fields.some((f) => isLocalized(f) && `${f.name}${l.suffix}` === name))?.suffix)
      .filter(Boolean),
  );
  const hasLocalized = fields.some(isLocalized);

  const renderField = (field: FieldConfig) => {
    const id = `field-${field.name}`;
    const label = t(`fields.${field.name}`);
    const help = field.help ? t(`help.${field.help}`) : null;
    const required = field.required ? <span className="text-primary" aria-hidden> *</span> : null;
    const describe = (name: string) => [error(name) ? `${id}-${name}-error` : null, help ? `${id}-help` : null].filter(Boolean).join(" ") || undefined;
    const errorText = (name: string) =>
      error(name) ? (
        <p id={`${id}-${name}-error`} className="mt-1 flex items-center gap-1 text-xs text-primary">
          <AlertCircle aria-hidden className="size-3.5" />
          {t(`errors.${error(name)}`)}
        </p>
      ) : null;
    const helpText = help ? (
      <p id={`${id}-help`} className="mt-1 text-xs text-muted-ink">
        {help}
      </p>
    ) : null;

    if (isLocalized(field)) {
      const f = field as Extract<FieldConfig, { type: "text" | "textarea" }>;
      return (
        <div className={cn(field.wide && "sm:col-span-2")} key={field.name}>
          {localizedNames(field.name).map((name, i) => {
            const suffix = LANGS[i].suffix;
            const inputId = `${id}-${suffix}`;
            const current = value(name);
            const props = {
              id: inputId,
              name,
              defaultValue: typeof current === "string" ? current : "",
              disabled: readOnly,
              required: field.required && suffix === "Ru",
              maxLength: f.max,
              lang: LANGS[i].code === "kz" ? "kk" : LANGS[i].code,
              "aria-invalid": Boolean(error(name)),
              "aria-describedby": describe(name),
              className: "admin-input",
            };
            return (
              <div key={name} hidden={lang !== suffix}>
                <label htmlFor={inputId} className="mb-1 flex items-center gap-2 text-sm font-bold">
                  {label}
                  {required && suffix === "Ru" ? required : null}
                  <span className="rounded bg-chip px-1.5 text-[10px] uppercase">{LANGS[i].code}</span>
                </label>
                {f.type === "textarea" ? <textarea rows={f.rows ?? 5} {...props} /> : <input type="text" {...props} />}
                {errorText(name)}
                {helpText}
              </div>
            );
          })}
        </div>
      );
    }

    const wrap = (content: React.ReactNode, names: string[] = [field.name]) => (
      <div key={field.name} className={cn(field.wide && "sm:col-span-2")}>
        {content}
        {names.map((name) => (
          <span key={name}>{errorText(name)}</span>
        ))}
        {helpText}
      </div>
    );
    const current = value(field.name);
    const common = {
      id,
      name: field.name,
      disabled: readOnly,
      "aria-invalid": Boolean(error(field.name)),
      "aria-describedby": describe(field.name),
    };
    const labelEl = (
      <label htmlFor={id} className="mb-1 block text-sm font-bold">
        {label}
        {required}
      </label>
    );

    switch (field.type) {
      case "text":
        return wrap(
          <>
            {labelEl}
            <input
              type={field.pattern === "email" ? "email" : field.pattern === "url" ? "url" : "text"}
              defaultValue={typeof current === "string" ? current : ""}
              maxLength={field.max}
              required={field.required}
              className={cn("admin-input", field.pattern === "slug" && "font-mono")}
              {...common}
            />
          </>,
        );
      case "textarea":
        return wrap(
          <>
            {labelEl}
            <textarea rows={field.rows ?? 5} defaultValue={typeof current === "string" ? current : ""} maxLength={field.max} className="admin-input" {...common} />
          </>,
        );
      case "number":
        return wrap(
          <>
            {labelEl}
            <input type="number" inputMode="numeric" min={field.min} max={field.max} step={field.step ?? 1} defaultValue={typeof current === "string" ? current : ""} required={field.required} className="admin-input" {...common} />
          </>,
        );
      case "date":
        return wrap(
          <>
            {labelEl}
            <input type="date" defaultValue={typeof current === "string" ? current : ""} required={field.required} className="admin-input" {...common} />
          </>,
        );
      case "boolean":
        return wrap(
          <label htmlFor={id} className="mt-6 flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" id={id} name={field.name} defaultChecked={current === true || current === "on"} disabled={readOnly} className="size-4 accent-[var(--accent)]" />
            {label}
          </label>,
        );
      case "select":
        return wrap(
          <>
            {labelEl}
            <select defaultValue={typeof current === "string" ? current : ""} required={field.required} className="admin-input" {...common}>
              {!field.required && <option value="">—</option>}
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {t(`enums.${field.labels}.${option}`)}
                </option>
              ))}
            </select>
          </>,
        );
      case "relation":
        return wrap(
          <>
            {labelEl}
            <select defaultValue={typeof current === "string" ? current : ""} required={field.required} className="admin-input" {...common}>
              <option value="">{field.required ? t("form.choose") : "—"}</option>
              {(options[field.source] ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>,
        );
      case "tags": {
        const selected = new Set(Array.isArray(current) ? current : []);
        return wrap(
          <fieldset>
            <legend className="mb-1 text-sm font-bold">{label}</legend>
            <div className="flex flex-wrap gap-2">
              {(options.tags ?? []).map((tag) => (
                <label key={tag.value} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm has-[:checked]:border-accent-2 has-[:checked]:bg-accent-2-soft">
                  <input type="checkbox" name="tags" value={tag.value} defaultChecked={selected.has(tag.value)} disabled={readOnly} className="size-3.5 accent-[var(--accent-2)]" />
                  {tag.label}
                </label>
              ))}
            </div>
          </fieldset>,
        );
      }
      case "image": {
        const url = typeof current === "string" ? current : "";
        return wrap(
          <fieldset>
            <legend className="mb-1 text-sm font-bold">{label}</legend>
            <input type="hidden" name={field.name} value={url} />
            {url && (
              // eslint-disable-next-line @next/next/no-img-element -- превью уже сжатого файла из хранилища
              <img src={url} alt="" className="mb-2 h-28 w-auto rounded-lg border border-border object-cover" />
            )}
            <input
              id={id}
              type="file"
              name={`${field.name}__file`}
              accept="image/jpeg,image/png,image/webp,image/tiff"
              disabled={readOnly}
              aria-invalid={Boolean(error(field.name))}
              aria-label={label}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-chip file:px-3 file:py-1.5 file:font-bold"
            />
            {url && (
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" name={`${field.name}__remove`} disabled={readOnly} className="size-4" />
                {t("form.removeImage")}
              </label>
            )}
            <p className="mt-1 text-xs text-muted-ink">{t("help.image")}</p>
          </fieldset>,
        );
      }
      case "coordinates":
        return wrap(
          <CoordinatesField
            lat={String(value("latitude") ?? "")}
            lng={String(value("longitude") ?? "")}
            approximate={value("coordinatesApproximate") === true || value("coordinatesApproximate") === "on"}
            readOnly={readOnly}
            invalid={Boolean(error("latitude") || error("longitude"))}
          />,
          ["latitude", "longitude"],
        );
    }
  };

  return (
    <form ref={formRef} key={state.version} action={formAction} onInput={recount} noValidate className="space-y-5">
      {state.formError && (
        <p role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {t(`errors.form.${state.formError}`)}
        </p>
      )}
      {state.errors && (
        <p role="alert" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {t("errors.summary", { count: Object.keys(state.errors).length })}
        </p>
      )}
      {state.savedAt && !state.errors && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
          <CheckCircle2 aria-hidden className="size-4" />
          {t("notices.saved")}
        </p>
      )}

      {hasLocalized && (
        <div role="tablist" aria-label={t("form.languages")} className="flex gap-1 border-b border-border">
          {LANGS.map(({ suffix, code }) => (
            <button
              key={suffix}
              type="button"
              role="tab"
              aria-selected={lang === suffix}
              onClick={() => setLang(suffix)}
              className={cn(
                "-mb-px flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-sm font-bold uppercase",
                lang === suffix ? "border-border bg-surface" : "border-transparent text-muted-ink hover:text-ink",
              )}
            >
              {code}
              {errorLangs.has(suffix) && <AlertCircle aria-label={t("form.tabHasErrors")} className="size-3.5 text-primary" />}
              {!errorLangs.has(suffix) && (missing[suffix] ?? 0) > 0 && (
                <span className="rounded-full bg-lock-soft px-1.5 text-[10px] text-lock normal-case" title={t("form.missingTranslations", { count: missing[suffix] })}>
                  {t("form.missingShort", { count: missing[suffix] })}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{fields.map(renderField)}</div>

      {demoFlag && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isDemo" defaultChecked={initial.isDemo === true} disabled={readOnly} className="size-4 accent-[var(--accent)]" />
          {t("form.isDemo")}
        </label>
      )}

      {!readOnly && (
        <div className="sticky bottom-0 -mx-1 flex items-center gap-3 border-t border-border bg-bg/95 px-1 py-3">
          <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            <Save aria-hidden className="size-4" />
            {pending ? t("form.saving") : (submitLabel ?? t("form.save"))}
          </button>
          <span className="text-xs text-muted-ink">{t("form.requiredHint")}</span>
        </div>
      )}
    </form>
  );
}

function CoordinatesField({ lat, lng, approximate, readOnly, invalid }: { lat: string; lng: string; approximate: boolean; readOnly?: boolean; invalid: boolean }) {
  const t = loose(useTranslations("Admin"));
  const [point, setPoint] = useState({ lat, lng });
  const numeric = Number(point.lat) && Number(point.lng) ? { lat: Number(point.lat), lng: Number(point.lng) } : null;
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-bold">
        {t("fields.coordinates")}
        <span className="text-primary" aria-hidden> *</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm">
          {t("fields.latitude")}
          <input name="latitude" inputMode="decimal" value={point.lat} onChange={(e) => setPoint((p) => ({ ...p, lat: e.target.value }))} disabled={readOnly} aria-invalid={invalid} className="admin-input mt-1 font-mono" />
        </label>
        <label className="text-sm">
          {t("fields.longitude")}
          <input name="longitude" inputMode="decimal" value={point.lng} onChange={(e) => setPoint((p) => ({ ...p, lng: e.target.value }))} disabled={readOnly} aria-invalid={invalid} className="admin-input mt-1 font-mono" />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="coordinatesApproximate" defaultChecked={approximate} disabled={readOnly} className="size-4" />
          {t("fields.coordinatesApproximate")}
        </label>
      </div>
      <p className="mt-2 text-xs text-muted-ink">{t("help.coordinates")}</p>
      <div className="mt-2 h-72 overflow-hidden rounded-[12px] border border-border">
        <CoordinatePicker point={numeric} readOnly={readOnly} onPick={(p) => setPoint({ lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) })} />
      </div>
    </fieldset>
  );
}
