# Госархив ВКО — новый сайт (Code Masters Hackathon 9.0)

Переосмысление сайта Государственного архива Восточно-Казахстанской области ([e-arhiv.vko.gov.kz](http://e-arhiv.vko.gov.kz/ru)): электронный каталог с поиском, онлайн-выставки, «Архив памяти», карта филиалов, ИИ-помощник, три языка (KZ / RU / EN), светлая и тёмная темы.

> Сайт **информационный**: без заявлений, заказов и оплаты. Единственная форма — «Отзывы и предложения».
> Это хакатонный проект, **не официальный сайт** архива. Записи каталога — демонстрационные.

**Демо:** _ссылка Vercel появится после деплоя_

## Стек

| Задача | Решение |
|---|---|
| Фреймворк | Next.js 16 (App Router, TypeScript) |
| База данных | PostgreSQL: локально Docker, прод — Supabase |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Поиск | PostgreSQL full-text (`tsvector`, триггер) + `pg_trgm` для опечаток |
| Стили | Tailwind CSS 4 + shadcn/ui, дизайн-система «Бумага и чернила» |
| Языки / тема | next-intl, next-themes |
| Карта | Leaflet + OpenStreetMap |
| Файлы | `lib/storage.ts`: `public/uploads` локально, Supabase Storage в проде |
| ИИ | Claude API (`@anthropic-ai/sdk`) + запасной режим без API |
| Деплой | GitHub → Vercel |

## Запуск локально

Нужны Node.js 24 и запущенный Docker Desktop.

```bash
npm install
```

```bash
npm run db:up
```

```bash
npm run db:migrate
```

```bash
npm run seed
```

```bash
npm run dev
```

Сайт: http://localhost:3000. Без файла `.env.local` используется локальная база из `docker-compose.yml`; для остальных настроек скопируйте шаблон: `copy .env.example .env.local`.

Демо-сканы для каталога (картинки с пометкой «ДЕМО»): `npm run scans`.

## Полезные команды

| Команда | Что делает |
|---|---|
| `npm run db:up` / `db:down` | Запустить / остановить PostgreSQL в Docker (порт 5433) |
| `npm run db:migrate` | Применить миграции к локальной базе |
| `npm run db:deploy` | Применить миграции к продакшен-базе |
| `npm run db:studio` | Prisma Studio: просмотр таблиц в браузере |
| `npm run seed` / `seed:reset` | Заполнить базу демо-данными / очистить и заполнить заново |
| `npm run scans` | Сгенерировать демо-сканы в `public/uploads/demo` |
| `npm run scans:upload` | Загрузить демо-сканы в Supabase Storage |
| `npm run typecheck` / `lint` / `build` | Проверки и сборка |

## Структура

```
app/                 страницы (App Router)
components/ui/       компоненты shadcn/ui
lib/db.ts            подключение к базе (Prisma Client)
lib/storage.ts       хранилище файлов (local / supabase)
lib/archive/         архивные хелперы (шифр «Ф. · Оп. · Д.»)
prisma/schema.prisma схема базы данных
prisma/migrations/   миграции (включая поиск: tsvector + pg_trgm)
prisma/seed.ts       демо-данные; prisma/demo-data/ — сами данные
scripts/             генерация и загрузка демо-сканов
docs/                ТЗ, реальные данные архива, покрытие ТЗ, дорожная карта
design-reference/    макет дизайна
```

## Документация

- [Покрытие ТЗ](docs/tz-coverage.md)
- [Дорожная карта](docs/roadmap.md)
- [Реальные данные архива](docs/real-archive-data.md)

---

Code Masters Hackathon 9.0 · защита 13 ноября 2026
