// Обёртки над навигацией Next.js, которые сами подставляют префикс языка:
// <Link href="/catalog"> на странице /kz/... ведёт на /kz/catalog.
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
