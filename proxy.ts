// Proxy (в Next.js до 16-й версии назывался middleware) выполняется до каждой страницы:
//  • «/» и адреса без языка перенаправляет на нужный язык (/ru, /kz, /en);
//  • запоминает выбранный язык в cookie NEXT_LOCALE;
//  • добавляет HTTP-заголовок Link с hreflang-ссылками на другие языковые версии.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Все адреса, кроме API, служебных файлов Next.js/Vercel и файлов с точкой (favicon.ico, сканы)
  matcher: "/((?!api|_next|_vercel|uploads|.*\\..*).*)",
};
