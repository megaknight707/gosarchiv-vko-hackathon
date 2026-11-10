// Логотип-заглушка: печать «ГА» (Государственный архив). Двойной круг — как сургучная печать.
import { cn } from "@/lib/utils";

export function ArchiveSeal({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-full border-2 border-primary text-primary",
        "after:absolute after:inset-1 after:rounded-full after:border after:border-dashed after:border-primary after:opacity-60",
        className,
      )}
    >
      <b className="font-serif text-[13px] font-bold">ГА</b>
    </span>
  );
}
