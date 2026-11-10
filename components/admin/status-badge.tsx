// Статус публикации: иконка + текст + цвет (никогда только цвет).
import { Archive, CheckCircle2, Eye, FilePen, Globe, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicationStatus } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { loose } from "@/lib/admin/loose-translator";

const STYLE: Record<PublicationStatus, { Icon: typeof Eye; className: string }> = {
  DRAFT: { Icon: FilePen, className: "bg-chip text-muted-ink" },
  IN_REVIEW: { Icon: Eye, className: "bg-accent-2-soft text-accent-2" },
  NEEDS_CHANGES: { Icon: RotateCcw, className: "bg-lock-soft text-lock" },
  APPROVED: { Icon: CheckCircle2, className: "bg-ok-soft text-ok" },
  PUBLISHED: { Icon: Globe, className: "bg-ok text-surface" },
  ARCHIVED: { Icon: Archive, className: "bg-chip text-muted-ink line-through decoration-1" },
};

export function StatusBadge({ status, className }: { status: PublicationStatus; className?: string }) {
  const t = loose(useTranslations("Admin.status"));
  const { Icon, className: colors } = STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap", colors, className)}>
      <Icon aria-hidden className="size-3.5" />
      {t(status)}
    </span>
  );
}
