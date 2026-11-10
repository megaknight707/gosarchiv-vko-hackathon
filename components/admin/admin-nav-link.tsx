"use client";

// Пункт меню админки с подсветкой текущего раздела (aria-current="page").
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AdminNavLink({ href, exact, children }: { href: string; exact?: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
        active ? "bg-chip font-bold text-ink" : "text-muted-ink hover:bg-chip hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
