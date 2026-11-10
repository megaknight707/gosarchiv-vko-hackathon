"use client";

// Удаление записи с подтверждением (действие необратимо).
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function DeleteButton({ action }: { action: () => Promise<void> }) {
  const t = useTranslations("Admin.form");
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t("deleteConfirm"))) event.preventDefault();
      }}
    >
      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-primary/40 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10">
        <Trash2 aria-hidden className="size-4" />
        {t("delete")}
      </button>
    </form>
  );
}
