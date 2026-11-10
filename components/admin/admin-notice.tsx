// Короткое сообщение о результате действия («Сохранено», «Удалено», ошибка).
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  ok: { Icon: CheckCircle2, className: "bg-ok-soft text-ok" },
  warn: { Icon: AlertTriangle, className: "bg-lock-soft text-lock" },
  info: { Icon: Info, className: "bg-accent-2-soft text-accent-2" },
  error: { Icon: AlertTriangle, className: "bg-primary/10 text-primary" },
};

export function AdminNotice({ tone = "info", children, className }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  const { Icon, className: colors } = TONES[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-sm", colors, className)}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
