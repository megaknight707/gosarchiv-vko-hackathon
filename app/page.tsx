// Временная страница-заглушка (этап 1): проверяет шрифты, дизайн-токены
// и подключение к базе данных. На этапе 2 заменяется настоящей главной.
import { db } from "@/lib/db";

// Страница читает базу при каждом запросе (нужно, чтобы видеть статус подключения)
export const dynamic = "force-dynamic";

async function getDatabaseStatus() {
  try {
    const [documents, branches, funds] = await Promise.all([
      db.archiveDocument.count({ where: { status: "PUBLISHED" } }),
      db.branch.count(),
      db.fund.count(),
    ]);
    return { ok: true as const, documents, branches, funds };
  } catch (error) {
    console.error("Нет подключения к базе данных:", error);
    return { ok: false as const };
  }
}

export default async function HomePlaceholder() {
  const status = await getDatabaseStatus();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex size-16 shrink-0 -rotate-6 items-center justify-center rounded-full border-4 border-double border-primary font-serif text-2xl font-bold text-primary"
        >
          ГА
        </div>
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Государственный архив</p>
          <p className="font-serif text-lg">Восточно-Казахстанской области</p>
        </div>
      </div>

      <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">Госархив ВКО — сайт в разработке</h1>

      <div className="space-y-2 rounded-xl border bg-card p-6">
        <p className="font-serif text-2xl" lang="kk">
          Шығыс Қазақстан облысының мемлекеттік архиві
        </p>
        <p className="text-lg" lang="kk">
          Әә Ғғ Ққ Ңң Өө Ұұ Үү Һһ Іі — қазақ әріптері
        </p>
        <p className="font-mono text-sm text-muted-foreground">Ф. 1520 · Оп. 2 · Д. 14</p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">Сургуч</span>
        <span className="rounded-full bg-accent-2 px-3 py-1 text-white">Бирюза</span>
        <span className="rounded-full bg-ok-soft px-3 py-1 text-ok">Открытый доступ</span>
        <span className="rounded-full bg-lock-soft px-3 py-1 text-lock">Ограниченный доступ</span>
        <span className="rounded-full bg-chip px-3 py-1">Чип</span>
      </div>

      <p className="text-sm text-muted-foreground" role="status">
        {status.ok
          ? `База данных подключена: ${status.documents} документов, ${status.funds} фондов, ${status.branches} объектов на карте.`
          : "База данных недоступна — проверьте DATABASE_URL."}
      </p>
    </main>
  );
}
