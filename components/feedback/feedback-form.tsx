"use client";

// Форма «Отзывы и предложения». Отправляется через Server Action (без отдельного API).
// Имя и e-mail — необязательные; явно сказано, что это не обращение и не заявление.
import { CheckCircle2, Info } from "lucide-react";
import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitFeedback, type FeedbackState } from "@/lib/feedback/submit-feedback";
import { cn } from "@/lib/utils";

export function FeedbackForm() {
  const t = useTranslations("Feedback");
  const locale = useLocale();
  const [state, action, pending] = useActionState<FeedbackState, FormData>(submitFeedback, { status: "idle" });
  const values = state.status === "error" ? state.values : undefined;
  const invalid = (field: "message" | "email" | "consent") => state.status === "error" && state.fields?.includes(field);

  if (state.status === "success") {
    return (
      <div role="status" className="flex max-w-2xl flex-col items-start gap-4 rounded-[16px] border border-ok bg-ok-soft p-6 text-ok">
        <CheckCircle2 aria-hidden className="size-8" />
        <p className="text-lg font-bold">{t("success")}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-[10px] border border-current px-4 py-2 font-bold"
        >
          {t("another")}
        </button>
      </div>
    );
  }

  const field = "w-full rounded-[10px] border bg-surface px-3 py-2.5 text-ink";
  return (
    <form action={action} className="max-w-2xl space-y-5" noValidate>
      <p className="flex items-start gap-2 rounded-[12px] border border-accent-2 bg-accent-2-soft p-4 text-sm">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-2" />
        <span>
          {t("notice")}{" "}
          <a href="https://egov.kz" target="_blank" rel="noopener noreferrer" className="font-bold underline">
            egov.kz
          </a>
          .
        </span>
      </p>

      <input type="hidden" name="locale" value={locale} />
      {/* Ловушка для ботов: скрыта от людей и экранных дикторов */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 font-bold">{t("kind")}</legend>
        <div className="flex flex-wrap gap-2">
          {(["REVIEW", "SUGGESTION", "WISH"] as const).map((kind, i) => (
            <label key={kind} className="cursor-pointer">
              <input type="radio" name="kind" value={kind} defaultChecked={values?.kind ? values.kind === kind : i === 0} className="peer sr-only" />
              <span className="inline-block rounded-full border border-border bg-surface px-4 py-2 font-bold peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-accent-2">
                {t(`kinds.${kind}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="fb-message" className="mb-1 block font-bold">
          {t("message")} <span aria-hidden className="text-primary">*</span>
        </label>
        <textarea
          id="fb-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          defaultValue={values?.message}
          aria-invalid={invalid("message") || undefined}
          aria-describedby="fb-message-hint"
          className={cn(field, invalid("message") ? "border-destructive" : "border-border")}
        />
        <p id="fb-message-hint" className={cn("mt-1 text-sm", invalid("message") ? "text-destructive" : "text-muted-ink")}>
          {invalid("message") ? t("errors.message") : t("messageHint")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-name" className="mb-1 block font-bold">
            {t("name")} <span className="font-normal text-muted-ink">({t("optional")})</span>
          </label>
          <input id="fb-name" name="name" defaultValue={values?.name} maxLength={80} autoComplete="name" className={cn(field, "border-border")} />
        </div>
        <div>
          <label htmlFor="fb-email" className="mb-1 block font-bold">
            {t("email")} <span className="font-normal text-muted-ink">({t("optional")})</span>
          </label>
          <input
            id="fb-email"
            name="email"
            type="email"
            defaultValue={values?.email}
            maxLength={120}
            autoComplete="email"
            aria-invalid={invalid("email") || undefined}
            className={cn(field, invalid("email") ? "border-destructive" : "border-border")}
          />
          {invalid("email") && <p className="mt-1 text-sm text-destructive">{t("errors.email")}</p>}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5">
          <input type="checkbox" name="consent" required aria-invalid={invalid("consent") || undefined} className="mt-1 size-4 accent-[var(--accent)]" />
          <span>
            {t("consent")}{" "}
            <Link href="/privacy" className="font-bold text-primary underline">
              {t("consentLink")}
            </Link>
          </span>
        </label>
        {invalid("consent") && <p className="mt-1 text-sm text-destructive">{t("errors.consent")}</p>}
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-[10px] bg-destructive/10 px-4 py-3 font-bold text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className="h-12 rounded-[10px] bg-primary px-6 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
