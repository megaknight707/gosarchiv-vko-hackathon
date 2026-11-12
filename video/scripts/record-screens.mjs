// Запись экрана для видеопрезентации: сценарии действий по сценам, синхронно с озвучкой
// (время действий берётся из timeline.json — когда начинается каждая фраза).
//   node scripts/record-screens.mjs                 — все сцены
//   node scripts/record-screens.mjs 04 06           — только выбранные
// Публичные сцены пишутся с рабочей ссылки; админка — с локального стенда (http://localhost:3000),
// пароли демо-сотрудников берутся из файла VIDEO_STAFF_JSON (вне репозитория), в кадр логин не попадает.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "@playwright/test";
import sharp from "sharp";
import { Recorder } from "./recorder.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.VIDEO_BASE_URL ?? "https://gosarchiv-vko-hackathon.vercel.app";
const LOCAL = process.env.VIDEO_LOCAL_URL ?? "http://localhost:3000";
const OLD = "http://e-arhiv.vko.gov.kz";
const timeline = JSON.parse(readFileSync(join(ROOT, "timeline.json"), "utf8"));
const only = process.argv.slice(2);
const dir = (name) => join(ROOT, "recordings", name);

/** Время фраз сцены относительно её начала */
function clock(id) {
  const scene = timeline.scenes.find((s) => s.id === id);
  return {
    duration: scene.end - scene.start,
    p: (i) => scene.phrases[i].start - scene.start,
    c: (i, j) => scene.phrases[i].cues[j].start - scene.start,
    pEnd: (i) => scene.phrases[i].end - scene.start,
  };
}

async function settle(page, extra = 500) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(extra);
}

async function desktop(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25, locale: "ru-RU", colorScheme: "light", reducedMotion: "reduce", ...options });
  // Полосы прокрутки в кадре не нужны
  await context.addInitScript(() => {
    const add = () => {
      const style = document.createElement("style");
      style.textContent = "::-webkit-scrollbar{display:none} nextjs-portal{display:none!important}"; // без полос прокрутки и значка dev-режима
      document.head?.appendChild(style);
    };
    if (document.head) add();
    else document.addEventListener("DOMContentLoaded", add);
  });
  return context;
}

const noWait = async () => {};
/** Дождаться, пока картинки в выбранной области действительно загрузятся */
const imagesReady = (page, selector) =>
  page
    .waitForFunction(
      (sel) => [...document.querySelectorAll(sel)].filter((img) => img.getBoundingClientRect().top < innerHeight).every((img) => img.complete && img.naturalWidth > 0),
      selector,
      { timeout: 20000 },
    )
    .catch(() => {});

// ───────────── 02. Действующий сайт архива: три кадра «как сейчас» ─────────────
async function scene02(browser) {
  const context = await desktop(browser);
  const page = await context.newPage();
  mkdirSync(dir("02-old-site"), { recursive: true });
  const boxes = async (selectors) => {
    const result = {};
    for (const [key, locator] of Object.entries(selectors)) {
      const box = await locator.first().boundingBox().catch(() => null);
      if (box) result[key] = [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)];
    }
    return result;
  };
  const stills = [];
  const grab = async (name, url, scrollY, selectors) => {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(dir("02-old-site"), `${name}.jpg`), type: "jpeg", quality: 90 });
    stills.push({ name, image: `${name}.jpg`, url: url.replace("http://", ""), boxes: await boxes(selectors(page)) });
  };
  await grab("home", `${OLD}/ru`, 0, (p) => ({ lang: p.locator("a", { hasText: /^Қаз$/ }), branches: p.locator("a", { hasText: "Филиалы госархива" }) }));
  await grab("funds", `${OLD}/ru/Page/Index/1340`, 620, (p) => ({ files: p.locator("a", { hasText: "Фонды государственного архива" }) }));
  await grab("paid", `${OLD}/ru/Page/Index/52679`, 620, (p) => ({ price: p.locator("a", { hasText: "прейскуранта" }) }));
  writeFileSync(join(dir("02-old-site"), "stills.json"), JSON.stringify({ width: 1536, height: 864, stills }));
  await context.close();
  return { stills: stills.length };
}

// ───────────── 04. Школьник: поиск своими словами ─────────────
async function scene04(browser) {
  const t = clock("04-search");
  const context = await desktop(browser);
  const page = await context.newPage();
  const rec = new Recorder(page, dir("04-search"));
  await page.goto(`${BASE}/ru`);
  await settle(page, 900);
  await rec.until(t.p(0) - 0.1);
  await rec.click("#home-ask", { move: 0.5, settle: 100, wait: noWait });
  await rec.type("фотографии Усть-Каменогорска в 1960-х", { perChar: 0.068 });
  await rec.hold(0.35);
  await rec.mark("submit");
  await rec.press("Enter", { settle: 900, wait: () => imagesReady(page, "main img") });
  await settle(page);
  await rec.mark("chips", { bar: "main form[role=search] input[name=q]", box: "main div.bg-accent-2-soft", chips: "main div.bg-accent-2-soft a" });
  await rec.until(t.p(2) - 0.15);
  // «Понимает три языка…» — пролистываем результаты
  await rec.scrollTo(420, Math.max(1.2, t.p(3) - t.p(2) - 1.3));
  await rec.until(t.p(3) - 0.45);
  // Карточка документа и просмотр скана
  const card = page.locator("main ul li a[href*='/ru/catalog/c']").first();
  await rec.click(card, { move: 0.5, settle: 900 });
  await settle(page);
  await rec.mark("card", { demo: "main p[role=note]", viewer: "main [class*='lg:sticky']" });
  await rec.scrollTo(140, 0.5); // просмотрщик целиком в кадре
  const zoomIn = page.getByRole("button", { name: "Увеличить" }).first();
  await rec.click(zoomIn, { move: 0.5, settle: 350, wait: noWait });
  await rec.click(zoomIn, { move: 0.1, settle: 350, wait: noWait });
  await rec.hold(0.4);
  await rec.click(page.getByRole("button", { name: "Следующий лист" }).first(), { move: 0.5, settle: 500, wait: () => imagesReady(page, "main [class*='lg:sticky'] img") });
  await rec.until(t.p(4) - 0.1);
  await rec.mark("demo", { demo: "main p[role=note]" });
  await rec.until(t.duration + 0.7);
  const stats = rec.save();
  await context.close();
  return stats;
}

// ───────────── 05. Историк: шифр, копирование, фильтры в адресе, перечень фондов ─────────────
async function scene05(browser) {
  const t = clock("05-catalog");
  const context = await desktop(browser, { permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  const rec = new Recorder(page, dir("05-catalog"));
  await page.goto(`${BASE}/ru/catalog`);
  await settle(page, 900);
  await rec.until(t.p(0) + 0.9); // в это время монтаж «печатает» шифр на машинке
  await rec.click("main form[role=search] input[name=q]", { move: 0.5, settle: 100, wait: noWait });
  await rec.type("1520/1/3", { perChar: 0.11 });
  await rec.hold(0.3);
  await rec.press("Enter", { settle: 900 });
  await settle(page);
  await rec.mark("card", { cipher: "main code" });
  await rec.until(t.p(1) - 0.2);
  await rec.click(page.getByRole("button", { name: "Скопировать шифр" }).first(), { move: 0.55, settle: 400, wait: noWait });
  await rec.mark("copied");
  await rec.hold(0.7);
  // Фильтры каталога: состояние — в адресе страницы
  await page.goto(`${BASE}/ru/catalog`);
  await settle(page, 600);
  await rec.hold(0.25);
  await rec.click(page.locator("aside label", { hasText: /^Фото/ }).first(), { move: 0.45, settle: 800, wait: () => page.waitForURL(/type=PHOTO/, { timeout: 15000 }).catch(() => {}) });
  await rec.click(page.locator("aside label", { hasText: "Есть цифровая копия" }).first(), { move: 0.45, settle: 800, wait: () => page.waitForURL(/digital/, { timeout: 15000 }).catch(() => {}) });
  await rec.mark("url");
  await rec.until(t.p(2) - 0.35);
  // Перечень фондов архива (реальный реестр)
  await page.goto(`${BASE}/ru/catalog/funds`);
  await settle(page, 600);
  await rec.mark("registryAll", { count: page.getByText(/1[\s ]667/).first() });
  await rec.until(t.p(2) + 2.3);
  await rec.click("main input[name=q]", { move: 0.4, settle: 100, wait: noWait });
  await rec.type("комбинат", { perChar: 0.07 });
  await rec.press("Enter", { settle: 900 });
  await settle(page);
  await rec.mark("registry");
  await rec.until(t.duration + 0.7);
  const stats = rec.save();
  await context.close();
  return stats;
}

// ───────────── 06. Пенсионер: карта филиалов и маршрут ─────────────
async function scene06(browser) {
  const t = clock("06-branches");
  const context = await desktop(browser);
  const page = await context.newPage();
  const rec = new Recorder(page, dir("06-branches"));
  await page.goto(`${BASE}/ru/branches`);
  await settle(page, 2500);
  // Первый кадр — карта без маркеров: монтаж «роняет» маркеры на их настоящие места
  await page.addStyleTag({ content: ".leaflet-marker-pane{opacity:0}" }).then((handle) => handle.evaluate((el) => el.setAttribute("data-video-hide", "1")));
  await rec.mark("markers", { markers: ".leaflet-marker-icon", map: ".leaflet-container" });
  await rec.until(t.p(0) + 1.5);
  await page.evaluate(() => document.querySelector("style[data-video-hide]")?.remove());
  await rec.mark("markersShown");
  await rec.until(t.p(1) - 0.9);
  await rec.click(page.getByPlaceholder("Например: Риддер"), { move: 0.45, settle: 100, wait: noWait });
  await rec.type("Лениногорск", { perChar: 0.07 });
  await rec.hold(0.3);
  await rec.click(page.locator("main ul li button", { hasText: "Риддер" }).first(), { move: 0.45, settle: 900, wait: noWait });
  await settle(page, 600);
  await rec.mark("selected", { marker: ".leaflet-marker-icon", map: ".leaflet-container" });
  await rec.hold(0.5);
  // Карточка филиала: адрес, телефон, руководитель
  const address = page.locator("#route-address");
  const routeTop = await address.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await rec.scrollTo(routeTop - 560, 0.8);
  await rec.mark("branchCard", { card: page.locator("main section, main article, main div").filter({ has: page.getByRole("heading", { name: "Риддерский городской филиал" }) }).last() });
  await rec.until(t.p(2) - 0.3);
  // Маршрут без геолокации: вводим адрес
  await rec.click(address, { move: 0.5, settle: 150, wait: noWait });
  await rec.type("Усть-Каменогорск", { perChar: 0.06 });
  await rec.click(page.getByRole("button", { name: "Найти", exact: true }), { move: 0.4, settle: 1200, wait: () => page.waitForResponse((r) => r.url().includes("/api/geocode"), { timeout: 15000 }).catch(() => {}) });
  await rec.mark("route", { gis: "a[href*='2gis.kz/directions']", google: "a[href*='google.com/maps/dir']", map: ".leaflet-container", markers: ".leaflet-marker-icon" });
  await rec.move("a[href*='2gis.kz/directions']", 0.6);
  await rec.until(t.duration + 0.7);
  const stats = rec.save();
  await context.close();
  return stats;
}

// ───────────── 07. Онлайн-выставка и «Архив памяти» ─────────────
async function scene07(browser) {
  const t = clock("07-exhibitions");
  const context = await desktop(browser);
  const page = await context.newPage();
  const rec = new Recorder(page, dir("07-exhibitions"));
  await page.goto(`${BASE}/ru/exhibitions/ust-kamenogorsk-istoriya-goroda`);
  await settle(page, 1200);
  await rec.until(t.p(0) + 0.3);
  const enlarge = page.locator("button[aria-label^='Увеличить']").first();
  const top = await enlarge.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await rec.scrollTo(Math.max(0, top - 200), Math.max(1.8, t.p(1) - t.p(0) - 0.9));
  await rec.until(t.p(1) - 0.1);
  await rec.click(enlarge, { move: 0.5, settle: 700, wait: noWait });
  await rec.mark("lightbox");
  await rec.until(t.p(2) - 0.35);
  for (const [path, seconds] of [["/ru/memory", 1.5], ["/ru/memory/timeline", 1.5], ["/ru/memory/calendar", 9]]) {
    await page.goto(`${BASE}${path}`);
    await settle(page, 600);
    await rec.mark(`memory:${path.split("/").pop()}`);
    if (seconds > 5) await rec.until(t.duration + 0.7);
    else await rec.hold(seconds);
  }
  const stats = rec.save();
  await context.close();
  return stats;
}

// ───────────── 08. Языки, тёмная тема, слабовидящие, телефон ─────────────
async function scene08(browser) {
  const t = clock("08-for-everyone");
  const context = await desktop(browser);
  const page = await context.newPage();
  const rec = new Recorder(page, dir("08-for-everyone"));
  await page.goto(`${BASE}/ru`);
  await settle(page, 900);
  await rec.until(t.p(0) - 0.1);
  await rec.click(page.locator("header a[aria-label='Қазақша']").first(), { move: 0.5, settle: 700, wait: () => page.waitForURL(/\/kz/, { timeout: 15000 }) });
  await rec.mark("kz");
  await rec.hold(0.75);
  await rec.click(page.locator("header a[aria-label='English'], header a[aria-label='Ағылшынша']").first(), { move: 0.3, settle: 700, wait: () => page.waitForURL(/\/en/, { timeout: 15000 }) });
  await rec.mark("en");
  await rec.until(t.p(1) - 0.2);
  await rec.click(page.locator("header button[aria-label*='theme' i]").first(), { move: 0.4, settle: 500, wait: noWait });
  await rec.mark("dark");
  await rec.hold(0.7);
  await rec.click(page.locator("button", { hasText: /Low vision/i }).first(), { move: 0.45, settle: 600, wait: noWait });
  await rec.mark("lowVision");
  await rec.until(t.duration + 0.7);
  const stats = rec.save();
  await context.close();

  // Телефон: мобильная версия на казахском (нижнее меню, казахские буквы)
  const phone = await browser.newContext({ ...devices["iPhone 14"], deviceScaleFactor: 2, locale: "kk-KZ", colorScheme: "light", reducedMotion: "reduce" });
  const mobile = await phone.newPage();
  const mrec = new Recorder(mobile, dir("08-mobile"));
  await mobile.goto(`${BASE}/kz`);
  await settle(mobile, 900);
  await mrec.hold(1.2);
  await mrec.scrollTo(620, 2.6);
  await mrec.hold(2.5);
  const mobileStats = mrec.save();
  await phone.close();
  return { ...stats, mobile: mobileStats.frames };
}

// ───────────── 09. Услуги (справочно) и ИИ-помощник ─────────────
async function scene09(browser) {
  const t = clock("09-services-assistant");
  const question = "Есть ли фотографии Риддера?";
  // «Прогрев»: тот же вопрос заранее, чтобы в кадре ответ пришёл без долгого ожидания
  await fetch(`${BASE}/api/assistant`, { method: "POST", headers: { "Content-Type": "application/json", Origin: BASE }, body: JSON.stringify({ locale: "ru", messages: [{ role: "user", content: question }] }) }).then((r) => r.text()).catch(() => {});
  const context = await desktop(browser);
  const page = await context.newPage();
  const rec = new Recorder(page, dir("09-services-assistant"));
  await page.goto(`${BASE}/ru`);
  await settle(page, 900);
  const blockTop = await page.locator("#how-certificate").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), blockTop - 330);
  await page.waitForTimeout(400);
  await rec.mark("block", { block: "section[aria-labelledby='how-certificate'] > div" });
  await rec.until(t.p(1) - 0.5);
  await rec.click(page.locator("section[aria-labelledby='how-certificate'] a[href$='/services/paid']"), { move: 0.5, settle: 800 });
  await settle(page, 500);
  await rec.mark("notice", { notice: "main p[role=note]" });
  await rec.hold(0.5);
  const search = page.locator("#price-search");
  const searchTop = await search.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await rec.scrollTo(searchTop - 150, 0.8);
  await rec.click(search, { move: 0.4, settle: 100, wait: noWait });
  await rec.type("цифровая копия", { perChar: 0.07 });
  await rec.hold(0.3);
  await rec.mark("price", { table: "main details[open] table" });
  await rec.until(t.p(2) - 0.1);
  // «Заявок и оплаты на сайте нет» — возвращаемся к плашке наверху
  await rec.scrollTo(0, 0.9);
  await rec.mark("noticeTop", { notice: "main p[role=note]" });
  await rec.until(t.p(3) - 0.5);
  // ИИ-помощник
  await rec.click(page.getByRole("button", { name: /Спросить архив/ }).first(), { move: 0.5, settle: 600, wait: noWait });
  const input = page.getByRole("dialog").getByRole("textbox");
  await input.click();
  await rec.type(question, { perChar: 0.05 });
  await page.keyboard.press("Enter");
  await rec.mark("asked");
  await rec.live(2.6);
  await page.getByRole("dialog").locator("a[href*='/ru/catalog/']").first().waitFor({ timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(600);
  await rec.mark("answer", { auto: page.getByRole("dialog").getByText(/сформирован автоматически/) });
  await rec.until(t.duration + 0.7);
  const stats = rec.save();
  await context.close();
  return stats;
}

// Документ, который сцена 10 создаёт на локальном стенде. Перед записью удаляем копии от прошлых запусков —
// только в локальной базе и только демо-записи с этим названием.
const DEMO_TITLE = "Набережная Иртыша после реконструкции";
async function removeEarlierDemoDocuments(title) {
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(LOCAL)) return;
  const pg = createRequire(join(ROOT, "..", "package.json"))("pg");
  const client = new pg.Client({ connectionString: process.env.VIDEO_LOCAL_DATABASE_URL ?? "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv" });
  await client.connect();
  const { rowCount } = await client.query('DELETE FROM "ArchiveDocument" WHERE "titleRu" = $1 AND "isDemo" = true', [title]);
  await client.end();
  if (rowCount) console.log(`  удалено прежних демо-документов «${title}»: ${rowCount}`);
}

// ───────────── 10. Админка (локальный стенд): документ → проверка → публикация → журнал → аналитика ─────────────
async function scene10(browser) {
  const t = clock("10-admin");
  const staff = JSON.parse(readFileSync(process.env.VIDEO_STAFF_JSON, "utf8"));
  const login = async (email) => {
    const context = await desktop(browser);
    const page = await context.newPage();
    await page.goto(`${LOCAL}/ru/admin/login`);
    await page.getByLabel("Электронная почта").fill(email);
    await page.getByLabel("Пароль").fill(staff[email]);
    await page.getByRole("button", { name: "Войти" }).click();
    await page.waitForURL(/\/ru\/admin$/, { timeout: 30000 });
    await settle(page);
    return { context, page };
  };
  // Немного поисковых запросов и просмотров, чтобы в аналитике локального стенда были данные (демо-статистика)
  const queries = ["фотографии Усть-Каменогорска 1960-х", "фото Риддер", "строительство ГЭС", "метрические книги", "метрические книги", "переселенцы", "переселенцы", "переселенцы", "ревизские сказки", "личные фонды писателей", "Лениногорск", "комбинат 1950"];
  for (const q of queries) await fetch(`${LOCAL}/ru/catalog?q=${encodeURIComponent(q)}`).catch(() => {});
  for (const [section, n] of [["catalog", 9], ["home", 7], ["branches", 5], ["exhibitions", 4], ["memory", 3], ["services", 0], ["help", 2]]) {
    for (let i = 0; i < n; i++) await fetch(`${LOCAL}/api/pageview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, locale: "ru" }) }).catch(() => {});
  }

  await removeEarlierDemoDocuments(DEMO_TITLE);
  const archivist = await login("archivist@gosarchiv.demo");
  const moderator = await login("moderator@gosarchiv.demo");
  const admin = await login("superadmin@gosarchiv.demo");

  // За кадром: архивист заполняет форму нового документа
  const form = await archivist.context.newPage();
  await form.goto(`${LOCAL}/ru/admin/documents/new`);
  await settle(form);
  await form.locator("#admin-main form select[name=storageUnitId]").selectOption({ index: 3 });
  await form.locator("#admin-main form [name=titleRu]").fill(DEMO_TITLE);
  await form.locator("#admin-main form [name=yearFrom]").fill("1965");
  await form.locator("#admin-main form [name=summaryRu]").fill("Демонстрационная запись: вид на набережную Иртыша в Усть-Каменогорске.");
  await form.evaluate(() => window.scrollTo(0, 0));

  const rec = new Recorder(archivist.page, dir("10-admin"));
  await rec.until(t.p(1) - 0.45); // «У сотрудников архива — своя панель»: дашборд архивиста
  rec.page = form;
  await rec.hold(0.7);
  await rec.mark("draft");
  await rec.click(form.getByRole("button", { name: "Создать черновик" }), { move: 0.45, settle: 500, wait: () => form.waitForURL(/created=1/, { timeout: 30000 }) });
  await settle(form, 300);
  const docUrl = form.url().replace(/\?.*$/, "");
  // Скан: сгенерированное демо-изображение с пометкой «ДЕМО»
  const scan = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="860"><rect width="100%" height="100%" fill="#e9dfc9"/><rect x="30" y="30" width="1140" height="800" fill="none" stroke="#8e2a1f" stroke-width="8"/><text x="50%" y="46%" text-anchor="middle" font-family="serif" font-size="150" font-weight="700" fill="#6b6257">ДЕМО</text><text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="44" fill="#6b6257">Набережная Иртыша, 1965 — демонстрационный скан</text></svg>`)).jpeg().toBuffer();
  const files = form.locator("[aria-labelledby=files-title]");
  const filesTop = await files.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await rec.scrollTo(filesTop - 140, 0.6);
  await form.locator("input[type=file][multiple]").setInputFiles({ name: "naberezhnaya-1965.jpg", mimeType: "image/jpeg", buffer: scan });
  await form.getByText("загружен").waitFor({ timeout: 30000 });
  await form.waitForTimeout(700);
  await rec.mark("uploaded", { thumb: "[aria-labelledby=files-title] ol li" });
  await rec.hold(0.8);
  await rec.scrollTo(0, 0.45);
  await rec.click(form.getByRole("button", { name: "Отправить на проверку" }), { move: 0.45, settle: 600, wait: () => form.getByText("Статус изменён.").waitFor({ timeout: 20000 }) });
  await rec.mark("review");
  await rec.until(t.p(2) - 0.3);

  // Модератор: одобряет и публикует
  await moderator.page.goto(docUrl);
  await settle(moderator.page);
  rec.page = moderator.page;
  await rec.hold(0.3);
  await rec.click(moderator.page.getByRole("button", { name: "Одобрить" }), { move: 0.4, settle: 500, wait: () => moderator.page.getByRole("button", { name: "Опубликовать" }).waitFor({ timeout: 20000 }) });
  await rec.mark("approved");
  await rec.click(moderator.page.getByRole("button", { name: "Опубликовать" }), { move: 0.4, settle: 600, wait: () => moderator.page.getByText("Статус изменён.").waitFor({ timeout: 20000 }) });
  await rec.mark("published");
  await rec.until(t.p(3) - 0.2);

  // Главный администратор: журнал и аналитика
  await admin.page.goto(`${LOCAL}/ru/admin/audit`);
  await settle(admin.page);
  rec.page = admin.page;
  await rec.mark("audit");
  await rec.until(t.c(3, 1) - 0.2);
  await admin.page.goto(`${LOCAL}/ru/admin/analytics`);
  await settle(admin.page);
  await rec.mark("analytics");
  const zero = admin.page.getByRole("heading", { name: "Ищут, но не находят" });
  const zeroTop = await zero.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await rec.scrollTo(Math.max(0, zeroTop - 420), 1.2);
  await rec.mark("zero", { zero: admin.page.locator("section", { has: zero }) });
  await rec.until(t.duration + 0.7);
  const stats = rec.save();
  for (const s of [archivist, moderator, admin]) await s.context.close();
  return stats;
}

const SCENES = { "02": scene02, "04": scene04, "05": scene05, "06": scene06, "07": scene07, "08": scene08, "09": scene09, "10": scene10 };
const browser = await chromium.launch();
for (const [number, run] of Object.entries(SCENES)) {
  if (only.length && !only.includes(number)) continue;
  const started = Date.now();
  try {
    const stats = await run(browser);
    console.log(`✓ сцена ${number}:`, JSON.stringify(stats), `за ${Math.round((Date.now() - started) / 1000)} с`);
  } catch (error) {
    console.error(`✗ сцена ${number}:`, error.message.split("\n")[0]);
    process.exitCode = 1;
  }
}
await browser.close();
