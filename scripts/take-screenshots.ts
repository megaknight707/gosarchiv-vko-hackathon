// Скриншоты для README (docs/screenshots/): главная в светлой и тёмной теме, каталог, карточка,
// выставка, мобильная версия, админка.
//   npx tsx scripts/take-screenshots.ts                         — публичные страницы с рабочей ссылки
//   ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_BASE_URL=http://localhost:3000 npx tsx scripts/take-screenshots.ts
import { chromium, devices } from "@playwright/test";

const BASE = process.env.SCREENSHOT_BASE_URL ?? "https://gosarchiv-vko-hackathon.vercel.app";
const OUT = "docs/screenshots";

async function main() {
  const browser = await chromium.launch();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "light" });
  const page = await desktop.newPage();

  const shot = async (path: string, file: string, prepare?: () => Promise<void>) => {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await prepare?.();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${file}.png` });
    console.log("✓", file);
  };

  await shot("/ru", "home-light");
  await shot("/ru/catalog?q=%D1%84%D0%BE%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D0%B8%D0%B8+%D0%A3%D1%81%D1%82%D1%8C-%D0%9A%D0%B0%D0%BC%D0%B5%D0%BD%D0%BE%D0%B3%D0%BE%D1%80%D1%81%D0%BA%D0%B0+1960-%D1%85", "catalog");
  const docHref = await page.locator("main ul li a[href*='/ru/catalog/c']").first().getAttribute("href");
  if (docHref) await shot(docHref, "document-card");
  await shot("/ru/exhibitions/ust-kamenogorsk-istoriya-goroda", "exhibition");
  await shot("/ru/branches?b=ridder", "branches");
  await shot("/ru/services/paid", "paid-services");

  const dark = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const darkPage = await dark.newPage();
  await darkPage.addInitScript(() => localStorage.setItem("theme", "dark"));
  await darkPage.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await darkPage.waitForTimeout(800);
  await darkPage.screenshot({ path: `${OUT}/home-dark-en.png` });
  console.log("✓ home-dark-en");

  const mobile = await browser.newContext({ ...devices["Pixel 7"] });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/kz`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: `${OUT}/mobile-kz.png` });
  console.log("✓ mobile-kz");

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const adminBase = process.env.ADMIN_BASE_URL ?? BASE;
    const admin = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
    const adminPage = await admin.newPage();
    await adminPage.goto(`${adminBase}/ru/admin/login`);
    await adminPage.getByLabel("Электронная почта").fill(process.env.ADMIN_EMAIL);
    await adminPage.getByLabel("Пароль").fill(process.env.ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: "Войти" }).click();
    await adminPage.waitForURL(/\/admin$/);
    for (const [path, file] of [
      ["/ru/admin", "admin-dashboard"],
      ["/ru/admin/documents", "admin-documents"],
      ["/ru/admin/analytics", "admin-analytics"],
    ] as const) {
      await adminPage.goto(`${adminBase}${path}`, { waitUntil: "networkidle" });
      await adminPage.waitForTimeout(600);
      await adminPage.screenshot({ path: `${OUT}/${file}.png` });
      console.log("✓", file);
    }
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
