"use client";

// Бургер-меню для планшетов и телефонов: все разделы, поиск, версия для слабовидящих.
// Выезжает справа (Sheet на базе Radix Dialog: фокус внутри меню, Esc закрывает).
import Form from "next/form";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { isActivePath, mainNav, secondaryNav } from "@/lib/site/navigation";
import { cn } from "@/lib/utils";
import { LowVisionToggle } from "./low-vision-toggle";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("Nav");
  const tHeader = useTranslations("Header");
  const tSearch = useTranslations("Search");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={tHeader("openMenu")}
        className="grid size-9 place-items-center rounded-full border border-border bg-surface text-ink hover:bg-chip xl:hidden"
      >
        <Menu aria-hidden className="size-4" />
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} className="w-[86%] gap-0 overflow-y-auto border-border bg-surface p-0 sm:max-w-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="font-serif text-lg font-bold">{tHeader("menu")}</SheetTitle>
          <SheetClose aria-label={tHeader("closeMenu")} className="grid size-9 place-items-center rounded-full hover:bg-chip">
            <X aria-hidden className="size-5" />
          </SheetClose>
        </div>
        <SheetDescription className="sr-only">{tNav("label")}</SheetDescription>

        <Form action={`/${locale}/catalog`} className="flex gap-2 border-b border-border p-4" onSubmit={() => setOpen(false)}>
          <label htmlFor="mobile-search" className="sr-only">
            {tSearch("label")}
          </label>
          <input
            id="mobile-search"
            name="q"
            type="search"
            required
            placeholder={tSearch("placeholder")}
            className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-ink placeholder:text-muted-ink"
          />
          <button type="submit" aria-label={tSearch("submit")} className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Search aria-hidden className="size-4" />
          </button>
        </Form>

        <nav aria-label={tNav("label")} className="flex flex-col p-2">
          {[...mainNav, ...secondaryNav].map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-3 text-base transition-colors hover:bg-chip",
                  active && "bg-chip font-bold text-primary",
                )}
              >
                {tNav(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border p-4 text-sm text-muted-ink">
          <LowVisionToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
