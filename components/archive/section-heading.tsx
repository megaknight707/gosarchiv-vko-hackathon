// Заголовок секции с орнаментом из точек (как в макете) и необязательной ссылкой справа.
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  link,
  as: Heading = "h2",
  className,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", className)}>
      <div>
        <div
          aria-hidden
          className="mb-2.5 h-2.5 w-[120px] opacity-55"
          style={{ background: "radial-gradient(circle at 5px 5px, var(--accent) 2px, transparent 2.5px) 0 0/20px 10px" }}
        />
        <Heading className="font-serif text-2xl font-bold sm:text-[32px] sm:leading-tight">{title}</Heading>
        {subtitle && <p className="mt-1 text-muted-ink">{subtitle}</p>}
      </div>
      {link && (
        <Link href={link.href} className="hidden shrink-0 items-center gap-1 font-bold text-primary hover:underline sm:inline-flex">
          {link.label}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      )}
    </div>
  );
}
