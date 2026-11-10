// Штамп статуса доступа: иконка + текст + цвет (никогда только цвет — WCAG 1.4.1).
// Стиль — архивный штамп: рамка, капслок, лёгкий наклон.
import { FileText, Lock, LockOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type AccessStatus = "OPEN" | "DESCRIPTION_ONLY" | "RESTRICTED";

const STYLE: Record<AccessStatus, { Icon: typeof Lock; className: string }> = {
  OPEN: { Icon: LockOpen, className: "text-ok bg-ok-soft" },
  DESCRIPTION_ONLY: { Icon: FileText, className: "text-accent-2 bg-accent-2-soft" },
  RESTRICTED: { Icon: Lock, className: "text-lock bg-lock-soft" },
};

export function AccessStamp({ status, className }: { status: AccessStatus; className?: string }) {
  const t = useTranslations("Archive.access");
  const { Icon, className: colors } = STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex -rotate-3 items-center gap-1 rounded border-[1.5px] border-current px-1.5 py-[3px] text-[9px] font-bold tracking-[.04em] whitespace-nowrap uppercase sm:px-[7px] sm:text-[10.5px] sm:tracking-[.08em]",
        colors,
        className,
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={2.5} />
      {t(status)}
    </span>
  );
}
