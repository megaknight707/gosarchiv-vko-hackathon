"use client";

// Кнопки согласования для одной записи: «На проверку», «Одобрить», «Вернуть на доработку»
// (с обязательным комментарием), «Опубликовать», «Снять с публикации», «Вернуть из архива».
// Показываются только доступные роли переходы; сервер всё равно проверяет их заново.
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { TransitionState } from "@/lib/admin/entity-actions";
import type { TransitionOp } from "@/lib/admin/moderation";
import { cn } from "@/lib/utils";
import { loose } from "@/lib/admin/loose-translator";

const PRIMARY: TransitionOp[] = ["submit", "approve", "publish"];

export function ModerationPanel({ action, transitions }: { action: (state: TransitionState, formData: FormData) => Promise<TransitionState>; transitions: TransitionOp[] }) {
  const t = loose(useTranslations("Admin"));
  const [state, formAction, pending] = useActionState(action, {} as TransitionState);

  if (transitions.length === 0) return <p className="mt-3 text-sm text-muted-ink">{t("moderation.nothing")}</p>;

  return (
    <form action={formAction} key={state.version} className="mt-3 space-y-3">
      <div>
        <label htmlFor="moderation-comment" className="mb-1 block text-sm font-bold">
          {t("moderation.comment")}
        </label>
        <textarea
          id="moderation-comment"
          name="comment"
          rows={3}
          maxLength={2000}
          aria-describedby="moderation-comment-help"
          aria-invalid={state.result === "commentRequired"}
          className="admin-input"
        />
        <p id="moderation-comment-help" className="mt-1 text-xs text-muted-ink">
          {t("moderation.commentHelp")}
        </p>
      </div>
      {state.result && state.result !== "ok" && (
        <p role="alert" className="text-sm text-primary">
          {t(`moderation.errors.${state.result}`)}
        </p>
      )}
      {state.result === "ok" && (
        <p role="status" className="text-sm text-ok">
          {t("moderation.done")}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {transitions.map((op) => (
          <button
            key={op}
            type="submit"
            name="op"
            value={op}
            disabled={pending}
            className={cn(
              "rounded-[10px] px-3 py-2 text-sm font-bold disabled:opacity-60",
              PRIMARY.includes(op) ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border bg-surface hover:bg-chip",
            )}
          >
            {t(`transitions.${op}`)}
          </button>
        ))}
      </div>
    </form>
  );
}
