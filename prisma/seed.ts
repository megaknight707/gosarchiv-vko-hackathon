// Наполнение базы демо-данными.
//   npm run seed        — заполнить пустую базу
//   npm run seed:reset  — очистить ВСЕ таблицы и заполнить заново
//
// Филиалы и контакты — реальные (docs/real-archive-data.md).
// Фонды: реальные названия, демо-номера. Документы — демо (isDemo = true).
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { formatCipher } from "../lib/archive/cipher";
import { getPublicUrl } from "../lib/storage";
import { branches, categories, places, tags } from "./demo-data/reference";
import { funds } from "./demo-data/funds";
import { demoPageCount, documents, hasDemoScans, scanSize, type DemoDocType } from "./demo-data/documents";
import { news } from "./demo-data/news";
import { seedContent } from "./seed-content";
import { seedMemory } from "./seed-memory";
import { seedCalendar } from "./seed-calendar";
import { seedFundRegistry } from "./seed-fund-registry";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const LOCAL_DB = "postgresql://gosarchiv:gosarchiv@localhost:5433/gosarchiv";
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? LOCAL_DB;
// Сиду хватает двух соединений. Таймаут обязателен: без него, если пул Supabase не выдаёт
// соединение, Node завершался молча посреди заполнения базы.
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString, max: 2, connectionTimeoutMillis: 20_000, idleTimeoutMillis: 10_000 }),
});

// Шаги — в консоль, чтобы при сбое было видно, где он случился
let step = "подключение";
const progress = (name: string) => {
  step = name;
  console.log(`… ${name}`);
};
let finished = false;
process.on("beforeExit", () => {
  if (!finished && process.exitCode !== 1) {
    console.error(`❌ Сид прервался на шаге «${step}» (соединение с базой закрыто). Запустите ещё раз: npm run prod:seed:reset`);
    process.exitCode = 1;
  }
});

const RESET = process.argv.includes("--reset");

// ───────────── Тексты-шаблоны для описаний демо-документов ─────────────

const TYPE_LABEL: Record<DemoDocType, { kz: string; ru: string; en: string }> = {
  PHOTO: { kz: "Фотосурет", ru: "Фотография", en: "Photograph" },
  TEXT: { kz: "Жазба құжат", ru: "Письменный документ", en: "Written document" },
  MAP_DRAWING: { kz: "Карта / сызба", ru: "Карта / чертёж", en: "Map / drawing" },
  AUDIO_VIDEO: { kz: "Аудиовизуалды құжат", ru: "Аудиовизуальный документ", en: "Audiovisual record" },
  PERSONAL: { kz: "Жеке текті құжат", ru: "Документ личного происхождения", en: "Personal document" },
  ORGANIZATION: { kz: "Ұйым құжаты", ru: "Документ организации", en: "Organisational record" },
  HISTORICAL: { kz: "Тарихи құжат", ru: "Исторический документ", en: "Historical document" },
};

function periodLabels(year: number) {
  const decade = Math.floor(year / 10) * 10;
  return { kz: `${decade} жылдар`, ru: `${decade}-е годы`, en: `${decade}s` };
}

// ───────────── Очистка ─────────────

async function resetDatabase() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  // Имена таблиц берутся из системного каталога (не из пользовательского ввода)
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  console.log(`🧹 Очищено таблиц: ${tables.length}`);
}

// ───────────── Пользователи админки ─────────────

const STAFF = [
  { email: "superadmin@gosarchiv.demo", name: "Главный администратор (демо)", role: "SUPER_ADMIN" },
  { email: "siteadmin@gosarchiv.demo", name: "Администратор сайта (демо)", role: "SITE_ADMIN" },
  { email: "editor@gosarchiv.demo", name: "Редактор (демо)", role: "EDITOR" },
  { email: "archivist@gosarchiv.demo", name: "Сотрудник архива (демо)", role: "ARCHIVIST" },
  { email: "ridder-admin@gosarchiv.demo", name: "Администратор Риддерского филиала (демо)", role: "BRANCH_ADMIN", branch: "ridder" },
  { email: "moderator@gosarchiv.demo", name: "Модератор (демо)", role: "MODERATOR" },
  { email: "analyst@gosarchiv.demo", name: "Аналитик (демо)", role: "ANALYST" },
] as const;

async function seedUsers(branchIds: Map<string, string>) {
  // Пустая строка в .env считается «не задан»
  const sharedPassword = process.env.SEED_ADMIN_PASSWORD?.trim() || undefined;
  if (sharedPassword && sharedPassword.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD должен быть не короче 10 символов");
  }
  const credentials: { email: string; role: string; password: string }[] = [];
  for (const person of STAFF) {
    const password = sharedPassword ?? randomBytes(9).toString("base64url");
    await db.user.create({
      data: {
        email: person.email,
        name: person.name,
        role: person.role,
        passwordHash: await bcrypt.hash(password, 12),
        branchId: "branch" in person ? branchIds.get(person.branch) : undefined,
      },
    });
    credentials.push({ email: person.email, role: person.role, password: sharedPassword ? "(SEED_ADMIN_PASSWORD)" : password });
  }
  return credentials;
}

// ───────────── Основной сценарий ─────────────

async function main() {
  if (RESET) {
    await resetDatabase();
  } else if ((await db.branch.count()) > 0) {
    console.log("ℹ️  База уже заполнена. Чтобы пересоздать демо-данные: npm run seed:reset");
    finished = true;
    return;
  }

  // Филиалы
  progress("филиалы");
  const branchIds = new Map<string, string>();
  for (const branch of branches) {
    const created = await db.branch.create({ data: branch });
    branchIds.set(branch.slug, created.id);
  }

  // Справочники
  progress("справочники");
  const placeById = new Map<string, { id: string; nameKz: string; nameRu: string; nameEn: string }>();
  for (const place of places) {
    const created = await db.place.create({ data: place });
    placeById.set(place.slug, created);
  }
  const categoryBySlug = new Map<string, { id: string; nameKz: string; nameRu: string; nameEn: string }>();
  for (const [index, category] of categories.entries()) {
    categoryBySlug.set(category.slug, await db.category.create({ data: { ...category, sortOrder: index } }));
  }
  const tagBySlug = new Map<string, { id: string; nameKz: string; nameRu: string; nameEn: string }>();
  for (const tag of tags) {
    tagBySlug.set(tag.slug, await db.tag.create({ data: tag }));
  }

  // Фонды и описи
  progress("фонды, описи, дела");
  const fundRecords = new Map<string, { id: string; number: string; inventories: Map<string, string>; nextUnit: Map<string, number> }>();
  for (const fund of funds) {
    const created = await db.fund.create({
      data: {
        number: fund.number,
        titleKz: fund.titleKz,
        titleRu: fund.titleRu,
        titleEn: fund.titleEn,
        descriptionKz: fund.aboutKz ?? `«${fund.titleKz}» қорының құжаттары. Құрамы — демонстрациялық.`,
        descriptionRu: fund.aboutRu ?? `Документы фонда «${fund.titleRu}». Состав фонда — демонстрационный.`,
        descriptionEn: fund.aboutEn ?? `Records of the “${fund.titleEn}” fonds. The fonds composition is for demonstration.`,
        dateFrom: fund.dateFrom,
        dateTo: fund.dateTo,
        isPersonal: fund.isPersonal ?? false,
        categoryId: categoryBySlug.get(fund.category)?.id,
        branchId: branchIds.get(fund.branch),
        status: "PUBLISHED",
        isDemo: true,
      },
    });
    fundRecords.set(fund.key, { id: created.id, number: fund.number, inventories: new Map(), nextUnit: new Map() });
  }

  async function getInventory(fundKey: string, inventoryNumber: string) {
    const fund = fundRecords.get(fundKey)!;
    let inventoryId = fund.inventories.get(inventoryNumber);
    if (!inventoryId) {
      const meta = funds.find((f) => f.key === fundKey)!;
      const created = await db.inventory.create({
        data: {
          fundId: fund.id,
          number: inventoryNumber,
          titleKz: `${inventoryNumber}-тізімдеме. ${meta.titleKz}`,
          titleRu: `Опись ${inventoryNumber}. ${meta.titleRu}`,
          titleEn: `Inventory ${inventoryNumber}. ${meta.titleEn}`,
          status: "PUBLISHED",
          isDemo: true,
        },
      });
      inventoryId = created.id;
      fund.inventories.set(inventoryNumber, inventoryId);
    }
    return inventoryId;
  }

  // Документы
  progress("документы");
  let scannedPages = 0;
  for (const [index, doc] of documents.entries()) {
    const fundMeta = funds.find((f) => f.key === doc.fund);
    const fund = fundRecords.get(doc.fund);
    const place = placeById.get(doc.place);
    if (!fundMeta || !fund || !place) throw new Error(`Неизвестный фонд или место у ${doc.key}`);

    // Облисполком: опись 1 — до 1960 года, опись 2 — с 1960-го (как в настоящих фондах)
    const inventoryNumber = doc.fund === "oblispolkom" && doc.year >= 1960 ? "2" : "1";
    const inventoryId = await getInventory(doc.fund, inventoryNumber);
    const unitCounterKey = inventoryNumber;
    const unitNumber = String((fund.nextUnit.get(unitCounterKey) ?? 0) + 1 + index % 3);
    fund.nextUnit.set(unitCounterKey, Number(unitNumber));

    const withScans = hasDemoScans(doc);
    const pages = withScans ? demoPageCount(doc, index) : 0;
    const sheetsCount = pages > 0 ? pages : 3 + ((index * 13) % 38);

    const unit = await db.storageUnit.create({
      data: {
        inventoryId,
        number: unitNumber,
        titleKz: doc.titleKz,
        titleRu: doc.titleRu,
        titleEn: doc.titleEn,
        dateFrom: doc.year,
        dateTo: doc.year,
        sheetsCount,
        status: "PUBLISHED",
        isDemo: true,
      },
    });

    const label = TYPE_LABEL[doc.type];
    const period = periodLabels(doc.year);
    const docTags = doc.tags.map((slug) => {
      const tag = tagBySlug.get(slug);
      if (!tag) throw new Error(`Неизвестный тег «${slug}» у ${doc.key}`);
      return tag;
    });
    const category = categoryBySlug.get(fundMeta.category)!;
    const { width, height } = scanSize(doc.type);

    await db.archiveDocument.create({
      data: {
        storageUnitId: unit.id,
        titleKz: doc.titleKz,
        titleRu: doc.titleRu,
        titleEn: doc.titleEn,
        cipher: formatCipher({ fund: fund.number, inventory: inventoryNumber, unit: unitNumber }),
        yearFrom: doc.year,
        yearTo: doc.year,
        periodLabelKz: period.kz,
        periodLabelRu: period.ru,
        periodLabelEn: period.en,
        docType: doc.type,
        language: doc.language ?? "ru",
        sheetsCount,
        summaryKz: `${label.kz}: «${doc.titleKz}». ${place.nameKz}, ${doc.year} ж. Тақырыбы: ${docTags.map((t) => t.nameKz).join(", ")}.`,
        summaryRu: `${label.ru}: «${doc.titleRu}». ${place.nameRu}, ${doc.year} г. Тематика: ${docTags.map((t) => t.nameRu).join(", ")}.`,
        summaryEn: `${label.en}: “${doc.titleEn}”. ${place.nameEn}, ${doc.year}. Topics: ${docTags.map((t) => t.nameEn).join(", ")}.`,
        historicalNoteKz: fundMeta.aboutKz
          ? `${fundMeta.aboutKz} Іс сипаттамасы — демонстрациялық.`
          : `Құжат «${fundMeta.titleKz}» қорынан («${category.nameKz}» тақырыптық тобы). Сипаттама каталогтың жұмысын көрсету үшін жасалған.`,
        historicalNoteRu: fundMeta.aboutRu
          ? `${fundMeta.aboutRu} Описание дела — демонстрационное.`
          : `Документ из фонда «${fundMeta.titleRu}» (тематическая группа «${category.nameRu}»). Описание составлено для демонстрации работы каталога.`,
        historicalNoteEn: fundMeta.aboutEn
          ? `${fundMeta.aboutEn} The file description is for demonstration.`
          : `Document from the “${fundMeta.titleEn}” fonds (thematic group “${category.nameEn}”). The description was prepared to demonstrate the catalogue.`,
        placeName: place.nameRu,
        placeId: place.id,
        author: doc.author ?? fundMeta.titleRu,
        accessStatus: doc.access,
        hasDigitalCopy: withScans,
        branchId: branchIds.get(fundMeta.branch),
        featured: doc.featured ?? false,
        status: "PUBLISHED",
        isDemo: true,
        tags: { connect: docTags.map((t) => ({ id: t.id })) },
        files: withScans
          ? {
              create: Array.from({ length: pages }, (_, i) => ({
                kind: "IMAGE" as const,
                pageNumber: i + 1,
                url: getPublicUrl(`demo/${doc.key}/p${i + 1}.webp`),
                previewUrl: getPublicUrl(`demo/${doc.key}/p${i + 1}-thumb.webp`),
                width,
                height,
                mimeType: "image/webp",
              })),
            }
          : undefined,
      },
    });
    scannedPages += pages;
  }

  // Новости
  progress("новости");
  for (const item of news) {
    await db.news.create({
      data: {
        slug: item.slug,
        category: item.category,
        branchId: item.branch ? branchIds.get(item.branch) : undefined,
        publishedAt: new Date(`${item.publishedAt}T09:00:00+05:00`),
        titleKz: item.titleKz,
        titleRu: item.titleRu,
        titleEn: item.titleEn,
        excerptKz: item.excerptKz,
        excerptRu: item.excerptRu,
        excerptEn: item.excerptEn,
        bodyKz: item.excerptKz,
        bodyRu: item.excerptRu,
        bodyEn: item.excerptEn,
        sourceUrl: item.sourceUrl,
        status: "PUBLISHED",
        isDemo: true,
      },
    });
  }

  progress("страницы и FAQ");
  const content = await seedContent(db);
  progress("архив памяти и выставки");
  const memory = await seedMemory(db);
  progress("календарь памятных дат");
  const memorableDates = await seedCalendar(db);
  progress("перечень фондов");
  const registryFunds = await seedFundRegistry(db);
  progress("сотрудники");
  const credentials = await seedUsers(branchIds);

  const ukgPhotos60s = documents.filter(
    (d) => d.type === "PHOTO" && d.place === "ust-kamenogorsk" && d.year >= 1960 && d.year <= 1969,
  ).length;

  console.log("✅ Демо-данные загружены:");
  console.log(`   филиалов: ${branches.length}, мест: ${places.length}, фондов: ${funds.length}`);
  console.log(`   документов: ${documents.length} (фото Усть-Каменогорска 1960-х: ${ukgPhotos60s}), страниц сканов: ${scannedPages}`);
  console.log(`   новостей: ${news.length}, страниц: ${content.pages}, FAQ: ${content.faq}, выставок: ${memory.exhibitions}, памятных дат: ${memorableDates}, фондов в реестре: ${registryFunds}, пользователей: ${credentials.length}`);
  console.log("\n🔑 Учётные записи админки (НЕ сохраняйте в git):");
  console.table(credentials);
  finished = true;
  console.log("\nℹ️  Файлы демо-сканов: npm run scans (локально) / npm run scans:upload (Supabase)");
}

main()
  .catch((error) => {
    console.error(`❌ Ошибка сида на шаге «${step}»:`, error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
