// Шесть сценариев защиты из CLAUDE.md §11 — глазами обычного посетителя и сотрудника архива.
// Селекторы — по ролям и подписям (как их «видит» экранный диктор), а не по CSS-классам.
import { expect, test } from "@playwright/test";

test.describe("Сценарии посетителей", () => {
  test("1. Школьник: поиск своими словами → фильтры → карточка → скан @mobile", async ({ page }) => {
    await page.goto("/ru");
    await page.locator("#home-ask").fill("фотографии Усть-Каменогорска в 1960-х");
    await page.locator("#home-ask").press("Enter");
    await expect(page).toHaveURL(/\/ru\/catalog\?/);
    // Запрос разобран в понятные фильтры, найдены записи
    await expect(page.getByText(/Найден|Найдено/).first()).toBeVisible();
    const firstCard = page.locator("main ul li a[href*='/ru/catalog/c']").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/ru\/catalog\/c[a-z0-9]+/);
    // Просмотрщик скана: увеличение и счётчик листов
    await expect(page.getByRole("button", { name: "Увеличить" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Увеличить" }).first().click();
    await expect(page.getByText(/Лист 1 из \d+/)).toBeVisible();
  });

  test("2. Историк: поиск по номеру фонда, шифр с копированием, ссылка на карточку", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/ru/catalog?fund=1520");
    await page.locator("main ul li a[href*='/ru/catalog/c']").first().click();
    const cipher = page.locator("code").filter({ hasText: /Ф\. 1520 · Оп\. \d+ · Д\. \d+/ }).first();
    await expect(cipher).toBeVisible();
    await page.getByRole("button", { name: "Скопировать шифр" }).click();
    await expect(page.getByText("Шифр скопирован")).toBeVisible();
    // Адрес карточки стабилен — им можно поделиться
    const url = page.url();
    await page.goto(url);
    await expect(cipher).toBeVisible();
  });

  test("3. Пенсионер: филиалы → Риддер → адрес и маршрут без геолокации @mobile", async ({ page }) => {
    await page.goto("/ru/branches?b=ridder");
    await expect(page.getByRole("heading", { name: /Риддер/ }).first()).toBeVisible();
    await expect(page.getByText(/ул\. Ч\. Уалиханова, 44/).first()).toBeVisible();
    // Маршрут во внешних сервисах — 2GIS и Google Maps
    await expect(page.locator("a[href*='2gis.kz/directions']").first()).toBeAttached();
    await expect(page.locator("a[href*='google.com/maps/dir']").first()).toBeAttached();
    // Без геолокации можно ввести свой адрес
    await expect(page.getByLabel("Начальный адрес")).toBeAttached();
  });

  test("4. Иностранный исследователь: EN и тёмная тема сохраняются", async ({ page }) => {
    await page.goto("/ru/catalog");
    await page.getByRole("link", { name: "English" }).first().click();
    await expect(page).toHaveURL(/\/en\/catalog/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByRole("button", { name: /theme/i }).first().click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    // Переход на другую страницу — язык и тема на месте
    await page.goto("/en/branches");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Branches/i);
  });

  test("6. ИИ-помощник: ответ со ссылками на карточки и пометкой «сформировано автоматически»", async ({ page }) => {
    await page.goto("/ru");
    await page.getByRole("button", { name: /Спросить архив/ }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox").fill("фотографии Усть-Каменогорска 1960-х");
    await dialog.getByRole("textbox").press("Enter");
    // Работает и с Claude, и в запасном режиме без API (AI_MODE=offline)
    await expect(dialog.locator("a[href*='/ru/catalog']").first()).toBeVisible({ timeout: 45_000 });
    await expect(dialog.getByText(/сформирован автоматически/)).toBeVisible();
  });
});

test.describe("Негативные сценарии", () => {
  test("Несуществующая страница — понятная 404 с шапкой сайта", async ({ page }) => {
    const response = await page.goto("/ru/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /каталог/i }).first()).toBeVisible();
  });

  test("Админка без входа недоступна, неверный пароль — понятная ошибка", async ({ page }) => {
    await page.goto("/ru/admin/users");
    await expect(page).toHaveURL(/\/ru\/admin\/login/);
    await page.getByLabel("Электронная почта").fill("nobody@example.test");
    await page.getByLabel("Пароль").fill("wrong-password");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.locator("#login-error")).toContainText("Неверная почта или пароль");
  });

  test("Экспорт и файлы без прав — отказ", async ({ request }) => {
    expect((await request.get("/api/admin/export?entity=documents")).status()).toBe(401);
    expect((await request.get("/api/files/nonexistentfile123?v=view")).status()).toBe(404);
  });
});

// 5. Сотрудник архива — полный путь согласования. Нужны учётные записи демо-сотрудников:
//    E2E_ARCHIVIST_EMAIL / E2E_ARCHIVIST_PASSWORD, E2E_MODERATOR_EMAIL / E2E_MODERATOR_PASSWORD.
const staff = {
  archivist: { email: process.env.E2E_ARCHIVIST_EMAIL, password: process.env.E2E_ARCHIVIST_PASSWORD },
  moderator: { email: process.env.E2E_MODERATOR_EMAIL, password: process.env.E2E_MODERATOR_PASSWORD },
};

test.describe("Сценарий сотрудника архива", () => {
  test.skip(!staff.archivist.password || !staff.moderator.password, "нет учётных записей E2E_* — сценарий пропущен");

  test("5. Документ: создание → скан → на проверку → одобрение → публикация → каталог", async ({ page }) => {
    const stamp = Date.now();
    const title = `Проверочная запись сценария ${stamp}`;
    const login = async (who: keyof typeof staff) => {
      await page.goto("/ru/admin/login");
      await page.getByLabel("Электронная почта").fill(staff[who].email!);
      await page.getByLabel("Пароль").fill(staff[who].password!);
      await page.getByRole("button", { name: "Войти" }).click();
      await expect(page).toHaveURL(/\/ru\/admin$/);
    };

    await login("archivist");
    await page.goto("/ru/admin/documents/new");
    const form = page.locator("#admin-main form");
    await form.locator("select[name=storageUnitId]").selectOption({ index: 1 });
    await form.locator("[name=titleRu]").fill(title);
    await form.locator("[name=yearFrom]").fill("1965");
    await form.locator("[name=summaryRu]").fill("Демонстрационная запись автоматической проверки сценария.");
    await page.getByRole("button", { name: "Создать черновик" }).click();
    await expect(page).toHaveURL(/created=1/);

    // Скан: маленький PNG (сигнатура проверяется на сервере)
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    await page.locator("input[type=file][multiple]").setInputFiles({ name: "scan.png", mimeType: "image/png", buffer: png });
    await expect(page.getByText("загружен")).toBeVisible();
    await page.getByRole("button", { name: "Отправить на проверку" }).click();
    await expect(page.getByText("Статус изменён.")).toBeVisible();
    const docUrl = page.url().replace(/\?.*$/, "");

    await page.getByRole("button", { name: "Выйти" }).first().click();
    await expect(page).toHaveURL(/\/ru\/admin\/login/);
    await login("moderator");
    await page.goto(docUrl);
    await page.getByRole("button", { name: "Одобрить" }).click();
    await expect(page.getByText("Статус изменён.")).toBeVisible();
    await page.getByRole("button", { name: "Опубликовать" }).click();
    await expect(page.getByText("Опубликовано").first()).toBeVisible();

    // Документ виден в публичном каталоге
    await page.goto(`/ru/catalog?q=${encodeURIComponent("Проверочная запись сценария")}`);
    await expect(page.getByText(title).first()).toBeVisible();
  });
});
