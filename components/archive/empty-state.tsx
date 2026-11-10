// Пустое состояние: раздел готовится, ничего не найдено и т. п.
import { Archive, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  text,
  action,
  Icon = Archive,
  className,
}: {
  title: string;
  text?: string;
  action?: { href: string; label: string };
  Icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center", className)}>
      <span className="mb-4 grid size-14 place-items-center rounded-full bg-chip text-muted-ink">
        <Icon aria-hidden className="size-6" />
      </span>
      <p className="font-serif text-xl font-bold">{title}</p>
      {text && <p className="mt-2 max-w-md text-muted-ink">{text}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-6 rounded-[10px] bg-primary px-[18px] py-2.5 font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
