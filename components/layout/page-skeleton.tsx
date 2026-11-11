// Скелетон загрузки: серые блоки вместо содержимого, пока сервер готовит страницу.
// aria-busy и текст для экранного диктора — загрузка видна не только глазами.
export function PageSkeleton({ label, cards = 6 }: { label: string; cards?: number }) {
  return (
    <div aria-busy="true" className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-8 sm:py-10">
      <span className="sr-only" role="status">{label}</span>
      <div className="h-4 w-48 rounded bg-chip" />
      <div className="mt-5 h-9 w-2/3 max-w-lg rounded bg-chip" />
      <div className="mt-3 h-4 w-1/2 max-w-md rounded bg-chip" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="h-44 rounded-[14px] border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
