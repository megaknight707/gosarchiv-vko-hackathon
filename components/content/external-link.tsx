// Ссылка на внешний (официальный) ресурс: открывается в новой вкладке, явно помечена значком
// и текстом для экранного диктора — по «Дополнениям к ТЗ» внешние переходы должны быть обозначены.
import { ExternalLink as ExternalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const t = useTranslations("Services");
  const internal = href.startsWith("/");
  return (
    <a
      href={href}
      target="_blank"
      rel={internal ? undefined : "noopener noreferrer"}
      className={cn("inline-flex items-baseline gap-1 font-bold text-primary underline-offset-4 hover:underline", className)}
    >
      <span>{children}</span>
      {!internal && (
        <>
          <ExternalIcon aria-hidden className="size-3.5 shrink-0 translate-y-0.5" />
          <span className="sr-only">({t("external")})</span>
        </>
      )}
    </a>
  );
}
